import express from 'express';
import { pool } from '../config/database.js';
import { adminMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// GET /api/devolucoes — lista reservas aprovadas (aguardando devolução ou já devolvidas)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.nome  AS usuario_nome,
              u.email AS usuario_email,
              e.nome  AS equipamento_nome
       FROM reservas r
       JOIN usuarios    u ON r.usuario_id    = u.id
       JOIN equipamentos e ON r.equipamento_id = e.id
       WHERE r.status IN ('aprovada', 'devolvida')
       ORDER BY
         CASE r.status WHEN 'aprovada' THEN 0 ELSE 1 END,
         r.data_fim ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/devolucoes/:id/devolver — confirma devolução e libera equipamento
router.patch('/:id/devolver', adminMiddleware, async (req, res) => {
  const { patrimonios_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reserva = await client.query(
      `SELECT r.*, e.nome AS equipamento_nome
       FROM reservas r
       JOIN equipamentos e ON r.equipamento_id = e.id
       WHERE r.id = $1 AND r.status = 'aprovada'`,
      [req.params.id]
    );

    if (reserva.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reserva não encontrada ou não está aprovada' });
    }

    const { equipamento_id } = reserva.rows[0];

    // Valida patrimônios se houver vinculados
    const vinculados = await client.query(
      'SELECT patrimonio_id FROM reserva_patrimonios WHERE reserva_id = $1',
      [req.params.id]
    );

    if (vinculados.rows.length > 0) {
      if (!Array.isArray(patrimonios_ids) || patrimonios_ids.length !== vinculados.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Confirme todos os ${vinculados.rows.length} patrimônio(s) devolvidos` });
      }
      // Libera patrimônios removendo o vínculo
      await client.query('DELETE FROM reserva_patrimonios WHERE reserva_id = $1', [req.params.id]);
    }

    await client.query(
      `UPDATE reservas SET status = 'devolvida', devolvida_em = NOW() WHERE id = $1`,
      [req.params.id]
    );

    await client.query(
      `UPDATE equipamentos SET disponivel = true WHERE id = $1`,
      [equipamento_id]
    );

    await client.query('COMMIT');

    res.json({
      mensagem: `Devolução de "${reserva.rows[0].equipamento_nome}" confirmada com sucesso.`,
      equipamento_id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
