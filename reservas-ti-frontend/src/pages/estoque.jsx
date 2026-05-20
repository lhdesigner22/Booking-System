import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import SkeletonTable from '../components/SkeletonTable.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';

const CATEGORIAS = ['Notebook', 'Monitor', 'Teclado', 'Mouse', 'Headset', 'Webcam', 'Cabo', 'Adaptador', 'Outro'];

const EMPTY_RETIRADA = {
  colaborador_nome: '',
  colaborador_email: '',
  local_setor: '',
  equipamento_id: '',
  quantidade: 1,
  observacoes: '',
};

function StockBar({ total, emUso }) {
  const disponivel = Math.max(total - emUso, 0);
  const pct = total > 0 ? Math.round((emUso / total) * 100) : 0;
  const cor = pct >= 100 ? '#F87171' : pct >= 60 ? '#FCD34D' : '#4ADE80';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>{disponivel} disponível</span>
        <span>{emUso}/{total} em uso</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: cor, borderRadius: 99, transition: 'width .4s' }} />
      </div>
    </div>
  );
}

const EMPTY = { nome: '', descricao: '', categoria: '', numero_serie: '', quantidade_total: 1, disponivel: true };

export default function Estoque() {
  const [itens, setItens]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [busca, setBusca]                     = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus]       = useState('todos');
  const [modal, setModal]                     = useState(false);
  const [editando, setEditando]               = useState(null);
  const [form, setForm]                       = useState(EMPTY);
  const [submitting, setSubmitting]           = useState(false);
  const [confirmDlg, setConfirmDlg]           = useState({ open: false, title: '', message: '', action: null });
  const [modalRetirada, setModalRetirada]     = useState(false);
  const [formRetirada, setFormRetirada]       = useState(EMPTY_RETIRADA);
  const [submittingRetirada, setSubmittingRetirada] = useState(false);
  const [tecnicoNome, setTecnicoNome]               = useState('');
  const toast = useToast();

  // Busca nome do técnico logado uma única vez
  const tecnicoFetched = useRef(false);
  useEffect(() => {
    if (tecnicoFetched.current) return;
    tecnicoFetched.current = true;
    api.get('/usuarios/perfil').then(r => setTecnicoNome(r.data.nome)).catch(() => {});
  }, []);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get('/equipamentos/estoque');
      setItens(res.data);
    } catch {
      toast({ message: 'Erro ao carregar estoque', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function abrirNovo() {
    setEditando(null);
    setForm(EMPTY);
    setModal(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setForm({
      nome:             item.nome,
      descricao:        item.descricao    || '',
      categoria:        item.categoria    || '',
      numero_serie:     item.numero_serie || '',
      quantidade_total: item.quantidade_total,
      disponivel:       item.disponivel,
    });
    setModal(true);
  }

  async function salvar() {
    if (!form.nome.trim())         return toast({ message: 'Nome é obrigatório', type: 'error' });
    if (form.quantidade_total < 1) return toast({ message: 'Quantidade deve ser ao menos 1', type: 'error' });

    setSubmitting(true);
    try {
      if (editando) {
        await api.put(`/equipamentos/${editando.id}`, form);
        toast({ message: 'Equipamento atualizado!' });
      } else {
        await api.post('/equipamentos', form);
        toast({ message: 'Equipamento cadastrado!' });
      }
      setModal(false);
      carregar();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao salvar', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function abrirRetirada() {
    setFormRetirada(EMPTY_RETIRADA);
    setModalRetirada(true);
  }

  async function confirmarRetirada() {
    const f = formRetirada;
    if (!f.colaborador_nome.trim()) return toast({ message: 'Informe o nome do colaborador', type: 'error' });
    if (!f.colaborador_email.trim()) return toast({ message: 'Informe o e-mail do colaborador', type: 'error' });
    if (!f.local_setor.trim())      return toast({ message: 'Informe o local/setor', type: 'error' });
    if (!f.equipamento_id)          return toast({ message: 'Selecione um equipamento', type: 'error' });
    if (!f.quantidade || f.quantidade < 1) return toast({ message: 'Quantidade inválida', type: 'error' });

    setSubmittingRetirada(true);
    try {
      await api.post('/retiradas', {
        colaborador_nome:  f.colaborador_nome.trim(),
        colaborador_email: f.colaborador_email.trim(),
        local_setor:       f.local_setor.trim(),
        equipamento_id:    f.equipamento_id,
        quantidade:        parseInt(f.quantidade, 10),
        observacoes:       f.observacoes.trim() || null,
      });
      toast({ message: 'Retirada registrada e estoque atualizado!' });
      setModalRetirada(false);
      carregar();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao registrar retirada', type: 'error' });
    } finally {
      setSubmittingRetirada(false);
    }
  }

  function excluir(item) {
    setConfirmDlg({
      open: true,
      title: 'Remover equipamento',
      message: `Remover "${item.nome}" do estoque? Esta ação não pode ser desfeita.`,
      action: async () => {
        try {
          await api.delete(`/equipamentos/${item.id}`);
          toast({ message: 'Equipamento removido' });
          carregar();
        } catch (err) {
          toast({ message: err.response?.data?.error || 'Erro ao remover', type: 'error' });
        }
      },
    });
  }

  const categorias = useMemo(() => {
    const cats = [...new Set(itens.map(i => i.categoria).filter(Boolean))];
    return cats.sort();
  }, [itens]);

  const itensFiltrados = useMemo(() => itens.filter(item => {
    const buscaOk =
      !busca ||
      item.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (item.categoria    || '').toLowerCase().includes(busca.toLowerCase()) ||
      (item.numero_serie || '').toLowerCase().includes(busca.toLowerCase());
    const catOk  = filtroCategoria === 'todas' || item.categoria === filtroCategoria;
    const dispOk = item.quantidade_disponivel > 0;
    const statusOk =
      filtroStatus === 'todos'      ? true :
      filtroStatus === 'disponivel' ? dispOk :
      filtroStatus === 'esgotado'   ? !dispOk : true;
    return buscaOk && catOk && statusOk;
  }), [itens, busca, filtroCategoria, filtroStatus]);

  const totais = useMemo(() => ({
    total:      itens.reduce((s, i) => s + i.quantidade_total,            0),
    emUso:      itens.reduce((s, i) => s + (i.quantidade_em_uso    || 0), 0),
    disponivel: itens.reduce((s, i) => s + (i.quantidade_disponivel || 0), 0),
    esgotados:  itens.filter(i => i.quantidade_disponivel === 0).length,
  }), [itens]);

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* Header */}
          <motion.div
            className="page-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h2>Controle de Estoque</h2>
              <p>Gerencie quantidades, categorias e patrimônio dos equipamentos</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <motion.button
                className="btn btn-ghost"
                onClick={abrirRetirada}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ gap: 8, borderColor: 'rgba(248,113,113,0.4)', color: '#F87171' }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
                Retirada de Item
              </motion.button>

              <motion.button
                className="btn btn-primary"
                onClick={abrirNovo}
                whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
                whileTap={{ scale: 0.97 }}
                style={{ gap: 8 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Novo Equipamento
              </motion.button>
            </div>
          </motion.div>

          {/* Stat cards */}
          <div className="stats-row">
            {[
              { label: 'Total Cadastrado', value: totais.total,      color: '#818CF8' },
              { label: 'Disponível',        value: totais.disponivel, color: '#4ADE80' },
              { label: 'Em Uso',            value: totais.emUso,      color: '#FCD34D' },
              { label: 'Esgotados',         value: totais.esgotados,  color: '#F87171' },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
                style={{ borderTop: `3px solid ${c.color}` }}
              >
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="form-input"
                placeholder="Buscar por nome, categoria, nº série..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ paddingLeft: 36, marginBottom: 0 }}
              />
            </div>
            <select className="form-input" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              style={{ maxWidth: 180, marginBottom: 0 }}>
              <option value="todas">Todas categorias</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-input" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              style={{ maxWidth: 180, marginBottom: 0 }}>
              <option value="todos">Todos os status</option>
              <option value="disponivel">Com estoque</option>
              <option value="esgotado">Esgotados</option>
            </select>
          </div>

          {/* Tabela */}
          <motion.div
            className="card"
            style={{ padding: 0, overflow: 'hidden' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="table-wrap">
              {loading ? (
                <SkeletonTable rows={4} cols={5} />
              ) : itensFiltrados.length === 0 ? (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                  <p>Nenhum equipamento encontrado</p>
                </motion.div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Equipamento</th>
                      <th>Categoria</th>
                      <th>Estoque</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {itensFiltrados.map((item, i) => {
                        const esgotado = item.quantidade_disponivel === 0;
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                            transition={{ delay: i * 0.04, duration: 0.22 }}
                          >
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.nome}</div>
                              {item.numero_serie && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
                                  {item.numero_serie}
                                </div>
                              )}
                              {item.descricao && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.descricao}</div>
                              )}
                            </td>
                            <td>
                              {item.categoria ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                                  color: '#818CF8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)',
                                }}>
                                  {item.categoria}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                              )}
                            </td>
                            <td style={{ minWidth: 160 }}>
                              <StockBar total={item.quantidade_total} emUso={item.quantidade_em_uso || 0} />
                            </td>
                            <td>
                              <span className={`badge badge-${esgotado ? 'indisponivel' : 'disponivel'}`}>
                                {esgotado ? '● Esgotado' : '● Disponível'}
                              </span>
                            </td>
                            <td>
                              <div className="actions">
                                <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
                                  onClick={() => abrirEditar(item)}>
                                  Editar
                                </motion.button>
                                <motion.button className="btn btn-danger btn-sm" whileTap={{ scale: 0.95 }}
                                  onClick={() => excluir(item)}>
                                  Remover
                                </motion.button>
                                {!esgotado && (
                                  <motion.button
                                    className="btn btn-sm"
                                    whileTap={{ scale: 0.95 }}
                                    title="Registrar retirada deste item"
                                    onClick={() => {
                                      setFormRetirada({ ...EMPTY_RETIRADA, equipamento_id: String(item.id) });
                                      setModalRetirada(true);
                                    }}
                                    style={{
                                      background: 'rgba(248,113,113,0.1)',
                                      border: '1px solid rgba(248,113,113,0.3)',
                                      color: '#F87171',
                                      gap: 5,
                                    }}
                                  >
                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                      <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                                      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                                    </svg>
                                    Retirar
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Modal cadastro/edição */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editando ? 'Editar Equipamento' : 'Novo Equipamento'}
        subtitle={editando ? 'Altere os dados do equipamento' : 'Preencha os dados do novo equipamento'}
      >
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input className="form-input" value={form.nome} placeholder="Ex: Notebook Dell"
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select className="form-input" value={form.categoria}
            onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
            <option value="">Sem categoria</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Número de Série / Patrimônio</label>
          <input className="form-input" value={form.numero_serie} placeholder="Ex: SN-20240001"
            onChange={e => setForm(f => ({ ...f, numero_serie: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Quantidade Total</label>
          <input type="number" min={1} className="form-input" value={form.quantidade_total}
            onChange={e => setForm(f => ({ ...f, quantidade_total: parseInt(e.target.value) || 1 }))} />
          {editando && editando.quantidade_em_uso > 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#FCD34D' }}>
              ⚠️ {editando.quantidade_em_uso} unidade(s) em uso — não pode reduzir abaixo disso.
            </p>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <input className="form-input" value={form.descricao} placeholder="Descrição opcional"
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.disponivel}
              onChange={e => setForm(f => ({ ...f, disponivel: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: 'var(--brand-green)', cursor: 'pointer' }} />
            Equipamento habilitado para reservas
          </label>
        </div>
        <div className="modal-footer">
          <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }} onClick={() => setModal(false)}>
            Cancelar
          </motion.button>
          <motion.button className="btn btn-primary" onClick={salvar} disabled={submitting}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            {submitting ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar'}
          </motion.button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        confirmLabel="Remover"
        onClose={() => setConfirmDlg(d => ({ ...d, open: false }))}
        onConfirm={() => confirmDlg.action?.()}
      />

      {/* ── Modal: Retirada de Item ── */}
      <Modal
        open={modalRetirada}
        onClose={() => setModalRetirada(false)}
        title="Retirada de Item"
        subtitle="Registre a saída do equipamento e para quem ele foi destinado"
      >
        {/* Info */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px', borderRadius: 10, marginBottom: 20,
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <svg width="15" height="15" fill="none" stroke="#818CF8" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: 12, color: 'rgba(129,140,248,0.9)', margin: 0, lineHeight: 1.5 }}>
            Preencha os dados do colaborador que está levando o item. A movimentação será salva no <strong>histórico de retiradas</strong> para rastreamento.
          </p>
        </div>

        {/* Colaborador nome */}
        <div className="form-group">
          <label className="form-label">Nome do colaborador *</label>
          <div className="input-icon-wrap">
            <svg className="input-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <input className="form-input" placeholder="Nome completo"
              value={formRetirada.colaborador_nome}
              onChange={e => setFormRetirada(f => ({ ...f, colaborador_nome: e.target.value }))} />
          </div>
        </div>

        {/* Colaborador email */}
        <div className="form-group">
          <label className="form-label">E-mail *</label>
          <div className="input-icon-wrap">
            <svg className="input-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
            </svg>
            <input className="form-input" type="email" placeholder="colaborador@email.com"
              value={formRetirada.colaborador_email}
              onChange={e => setFormRetirada(f => ({ ...f, colaborador_email: e.target.value }))} />
          </div>
        </div>

        {/* Local/Setor */}
        <div className="form-group">
          <label className="form-label">Local / Setor *</label>
          <div className="input-icon-wrap">
            <svg className="input-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <input className="form-input" placeholder="Ex: Sala 204, Administração, Sede..."
              value={formRetirada.local_setor}
              onChange={e => setFormRetirada(f => ({ ...f, local_setor: e.target.value }))} />
          </div>
        </div>

        {/* Equipamento */}
        <div className="form-group">
          <label className="form-label">Item retirado *</label>
          <select className="form-input"
            value={formRetirada.equipamento_id}
            onChange={e => setFormRetirada(f => ({ ...f, equipamento_id: e.target.value, quantidade: 1 }))}
          >
            <option value="">Selecione o equipamento...</option>
            {itens
              .filter(i => i.quantidade_disponivel > 0)
              .map(i => (
                <option key={i.id} value={i.id}>
                  {i.nome}{i.categoria ? ` — ${i.categoria}` : ''} ({i.quantidade_disponivel} disponível)
                </option>
              ))
            }
          </select>
          {itens.filter(i => i.quantidade_disponivel > 0).length === 0 && !loading && (
            <p style={{ fontSize: 12, color: '#F87171', marginTop: 6 }}>
              ⚠ Nenhum equipamento com estoque disponível no momento.
            </p>
          )}
        </div>

        {/* Quantidade */}
        <div className="form-group">
          <label className="form-label">Quantidade *</label>
          <input type="number" min={1}
            max={formRetirada.equipamento_id
              ? (itens.find(i => String(i.id) === String(formRetirada.equipamento_id))?.quantidade_disponivel ?? 999)
              : 999}
            className="form-input"
            value={formRetirada.quantidade}
            onChange={e => setFormRetirada(f => ({ ...f, quantidade: parseInt(e.target.value) || 1 }))}
          />
          {formRetirada.equipamento_id && (() => {
            const sel = itens.find(i => String(i.id) === String(formRetirada.equipamento_id));
            return sel ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Disponível: <strong style={{ color: '#4ADE80' }}>{sel.quantidade_disponivel}</strong> unidade(s)
              </p>
            ) : null;
          })()}
        </div>

        {/* Observações */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Observações <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
          <input className="form-input" placeholder="Ex: empréstimo até 30/06, evento externo..."
            value={formRetirada.observacoes}
            onChange={e => setFormRetirada(f => ({ ...f, observacoes: e.target.value }))} />
        </div>

        {/* Técnico responsável */}
        {tecnicoNome && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8, marginTop: 16,
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
          }}>
            <svg width="13" height="13" fill="none" stroke="#4ADE80" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Técnico responsável:{' '}
              <strong style={{ color: '#4ADE80' }}>{tecnicoNome}</strong>
            </span>
          </div>
        )}

        <div className="modal-footer">
          <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }}
            onClick={() => setModalRetirada(false)}>
            Cancelar
          </motion.button>
          <motion.button
            className="btn btn-primary"
            onClick={confirmarRetirada}
            disabled={submittingRetirada}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', boxShadow: submittingRetirada ? 'none' : '0 4px 14px rgba(239,68,68,0.3)' }}
          >
            {submittingRetirada ? 'Registrando...' : 'Confirmar Retirada'}
          </motion.button>
        </div>
      </Modal>
    </PageTransition>
  );
}
