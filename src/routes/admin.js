import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { adminMiddleware } from '../middleware/adminAuth.js';
import { notificarUsuarioStatusReserva } from '../services/emailService.js';

const router = express.Router();

// GET /api/admin/usuarios — lista todos os usuários
router.get('/usuarios', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, admin, setor FROM usuarios ORDER BY nome'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/usuarios — cria usuário (admin pode definir se é admin)
router.post('/usuarios', adminMiddleware, async (req, res) => {
  const { nome, email, senha, admin, setor } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Preencha todos os campos' });

  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, admin, setor) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, admin, setor',
      [nome, email, hash, admin === true || admin === 'true', setor || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/usuarios/:id — atualiza nome, email, setor e/ou papel admin
router.patch('/usuarios/:id', adminMiddleware, async (req, res) => {
  const { nome, email, admin, setor } = req.body;
  try {
    if (email) {
      const existe = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, req.params.id]
      );
      if (existe.rows.length > 0)
        return res.status(400).json({ error: 'E-mail já em uso por outro usuário' });
    }

    const result = await pool.query(
      `UPDATE usuarios
       SET nome  = COALESCE($1, nome),
           email = COALESCE($2, email),
           admin = COALESCE($3, admin),
           setor = COALESCE($4, setor)
       WHERE id = $5
       RETURNING id, nome, email, admin, setor`,
      [nome ?? null, email ?? null, admin ?? null, setor ? setor.trim() : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/usuarios/:id — remove usuário
router.delete('/usuarios/:id', adminMiddleware, async (req, res) => {
  // Impede que o admin exclua a si mesmo
  if (parseInt(req.params.id, 10) === req.userId) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
  }
  try {
    // Remove comentários feitos pelo usuário em qualquer reserva
    await pool.query('DELETE FROM comentarios WHERE usuario_id = $1', [req.params.id]);
    // Remove reservas do usuário (comentários nessas reservas cascadeiam)
    await pool.query('DELETE FROM reservas WHERE usuario_id = $1', [req.params.id]);
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ mensagem: 'Usuário removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/reservas — lista TODAS as reservas
router.get('/reservas', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.nome AS usuario_nome,
              e.nome AS equipamento_nome
       FROM reservas r
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN equipamentos e ON r.equipamento_id = e.id
       ORDER BY
         CASE r.status WHEN 'pendente' THEN 0 ELSE 1 END,
         r.data_inicio DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/reservas/:id/patrimonios — patrimônios vinculados a uma reserva
router.get('/reservas/:id/patrimonios', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.codigo, p.descricao
       FROM reserva_patrimonios rp
       JOIN patrimonios p ON p.id = rp.patrimonio_id
       WHERE rp.reserva_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/reservas/:id/status — admin aprova/recusa qualquer reserva
router.patch('/reservas/:id/status', adminMiddleware, async (req, res) => {
  const { status, patrimonios_ids } = req.body;
  const statusValidos = ['pendente', 'aprovada', 'cancelada', 'recusada'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${statusValidos.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reservaRes = await client.query(
      `SELECT r.*, e.nome AS equipamento_nome, u.nome AS usuario_nome, u.email AS usuario_email
       FROM reservas r
       JOIN equipamentos e ON r.equipamento_id = e.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (reservaRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    const reserva = reservaRes.rows[0];

    if (status === 'aprovada') {
      const totalPat = await client.query(
        'SELECT COUNT(*)::INTEGER AS count FROM patrimonios WHERE equipamento_id = $1',
        [reserva.equipamento_id]
      );
      if (totalPat.rows[0].count > 0) {
        if (!Array.isArray(patrimonios_ids) || patrimonios_ids.length === 0)
          return (() => { client.query('ROLLBACK'); return res.status(400).json({ error: 'Selecione os patrimônios a serem liberados' }); })();

        if (patrimonios_ids.length !== reserva.quantidade) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Selecione exatamente ${reserva.quantidade} patrimônio(s). Selecionado(s): ${patrimonios_ids.length}`,
          });
        }

        const check = await client.query(
          `SELECT p.id, p.codigo,
                  EXISTS(
                    SELECT 1 FROM reserva_patrimonios rp2
                    JOIN reservas r2 ON r2.id = rp2.reserva_id
                    WHERE rp2.patrimonio_id = p.id AND r2.status = 'aprovada'
                  ) AS em_uso
           FROM patrimonios p
           WHERE p.id = ANY($1::int[]) AND p.equipamento_id = $2`,
          [patrimonios_ids, reserva.equipamento_id]
        );

        if (check.rows.length !== patrimonios_ids.length) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Um ou mais patrimônios inválidos para este equipamento' });
        }
        const emUso = check.rows.filter(p => p.em_uso);
        if (emUso.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: `Patrimônio(s) em uso: ${emUso.map(p => p.codigo).join(', ')}` });
        }

        for (const pid of patrimonios_ids) {
          await client.query(
            'INSERT INTO reserva_patrimonios (reserva_id, patrimonio_id) VALUES ($1, $2)',
            [req.params.id, pid]
          );
        }
      }
    }

    const result = await client.query(
      `UPDATE reservas r SET status = $1
       FROM equipamentos e, usuarios u
       WHERE r.id = $2 AND r.equipamento_id = e.id AND r.usuario_id = u.id
       RETURNING r.*, e.nome AS equipamento_nome, u.nome AS usuario_nome, u.email AS usuario_email`,
      [status, req.params.id]
    );

    await client.query('COMMIT');

    const r = result.rows[0];
    notificarUsuarioStatusReserva({
      nome: r.usuario_nome, email: r.usuario_email,
      equipamento: r.equipamento_nome, status,
      data_inicio: r.data_inicio, data_fim: r.data_fim,
    });
    res.json(r);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/usuarios/:id/resetsenha — reset de senha pelo admin
router.patch('/usuarios/:id/resetsenha', adminMiddleware, async (req, res) => {
  const { novaSenha } = req.body;
  if (!novaSenha || novaSenha.length < 4) {
    return res.status(400).json({ error: 'Nova senha deve ter ao menos 4 caracteres' });
  }
  try {
    const hash = await bcrypt.hash(novaSenha, 10);
    const result = await pool.query(
      'UPDATE usuarios SET senha = $1 WHERE id = $2 RETURNING id, nome',
      [hash, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ mensagem: `Senha de ${result.rows[0].nome} redefinida com sucesso` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/pendentes-count — contagem rápida para badge da sidebar
router.get('/pendentes-count', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) AS count FROM reservas WHERE status = 'pendente'");
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/relatorios — estatísticas agregadas
router.get('/relatorios', adminMiddleware, async (req, res) => {
  try {
    const [porPeriodo, porEquipamento, porUsuario, totais] = await Promise.all([
      // Reservas por mês (últimos 6 meses)
      pool.query(`
        SELECT TO_CHAR(data_inicio, 'YYYY-MM') AS mes,
               COUNT(*) AS total,
               SUM(CASE WHEN status = 'aprovada'  THEN 1 ELSE 0 END) AS aprovadas,
               SUM(CASE WHEN status = 'recusada'  THEN 1 ELSE 0 END) AS recusadas,
               SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
               SUM(CASE WHEN status = 'pendente'  THEN 1 ELSE 0 END) AS pendentes
        FROM reservas
        WHERE data_inicio >= NOW() - INTERVAL '6 months'
        GROUP BY mes ORDER BY mes
      `),
      // Top equipamentos mais reservados
      pool.query(`
        SELECT e.nome, COUNT(r.id) AS total,
               SUM(CASE WHEN r.status = 'aprovada' THEN 1 ELSE 0 END) AS aprovadas
        FROM reservas r
        JOIN equipamentos e ON r.equipamento_id = e.id
        GROUP BY e.id, e.nome ORDER BY total DESC LIMIT 10
      `),
      // Top usuários com mais reservas
      pool.query(`
        SELECT u.nome, u.email, COUNT(r.id) AS total,
               SUM(CASE WHEN r.status = 'aprovada' THEN 1 ELSE 0 END) AS aprovadas
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.id
        GROUP BY u.id, u.nome, u.email ORDER BY total DESC LIMIT 10
      `),
      // Totais gerais
      pool.query(`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status = 'aprovada'  THEN 1 ELSE 0 END) AS aprovadas,
               SUM(CASE WHEN status = 'pendente'  THEN 1 ELSE 0 END) AS pendentes,
               SUM(CASE WHEN status = 'recusada'  THEN 1 ELSE 0 END) AS recusadas,
               SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
        FROM reservas
      `)
    ]);

    res.json({
      totais: totais.rows[0],
      porPeriodo: porPeriodo.rows,
      porEquipamento: porEquipamento.rows,
      porUsuario: porUsuario.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
