import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, ReactFlowProvider,
  addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
  Handle, Position, Panel,
  MarkerType, EdgeLabelRenderer, BaseEdge, getBezierPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Save, Loader2, Trash2, Plus, Play, MessageCircle,
  ToggleLeft, List, Database, AlignLeft, CircleDot,
  X, AlertCircle, Info, Braces, Smartphone, Eye,
  CalendarPlus, ChevronDown, ChevronUp, Settings,
  Mountain, Building2, RefreshCw, Check,
} from 'lucide-react';
import {
  GET_FLOW_DEFINITION, GET_CITIES, GET_TREKS,
  GET_DEPARTURES,
} from '../graphql/queries';
import {
  SAVE_FLOW_DEFINITION, DELETE_FLOW_DEFINITION,
  CREATE_DEPARTURE, UPDATE_DEPARTURE, DELETE_DEPARTURE,
} from '../graphql/mutations';
import { useToast } from '../context/ToastContext';
import FileUpload from '../components/ui/FileUpload';


// ─────────────────────────────────────────────────────────────────────────────
// Constants & meta
// ─────────────────────────────────────────────────────────────────────────────

const NODE_TYPES_META = {
  start:         { label: 'Start',          color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', icon: Play,          desc: 'Triggered by greeting keywords (hi / hello)' },
  text:          { label: 'Text Message',   color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', icon: MessageCircle, desc: 'Send plain text then auto-advance' },
  buttons:       { label: 'Buttons',        color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: ToggleLeft,    desc: 'Interactive button reply (max 3)' },
  list:          { label: 'Static List',    color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', icon: List,          desc: 'Static scrollable list picker' },
  dynamic_list:  { label: 'Dynamic List',  color: '#06b6d4', bg: '#ecfeff', border: '#67e8f9', icon: Database,      desc: 'Live data from DB (cities / treks / dates)' },
  collect_input: { label: 'Collect Input',  color: '#ec4899', bg: '#fdf2f8', border: '#f9a8d4', icon: AlignLeft,    desc: 'Wait for user to type (saves to variable)' },
  end:           { label: 'End',            color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: CircleDot,    desc: 'End conversation' },
};

const DYNAMIC_SOURCES = [
  { value: 'cities',        label: 'Cities',                               hint: null },
  { value: 'treks',         label: 'Treks',                                hint: 'needs {cityId} in context' },
  { value: 'dates',         label: 'Departure Dates',                      hint: 'needs {cityId} in context' },
  { value: 'departures',    label: 'Departures (triggers payment)',         hint: 'needs {trekId} or {cityId}' },
  { value: 'treks_on_date', label: 'Treks on a Date',                      hint: 'needs {selectedDate} + {cityId}' },
];

let _seq = 1;
const newId = () => `n_${Date.now()}_${_seq++}`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function stripTypename(obj) {
  if (Array.isArray(obj)) return obj.map(stripTypename);
  if (obj && typeof obj === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k !== '__typename') o[k] = stripTypename(v);
    }
    return o;
  }
  return obj;
}

function buildFlowInput(rfNodes, rfEdges) {
  return {
    nodes: rfNodes.map(n => ({
      id: n.id, type: n.type,
      position: { x: n.position.x, y: n.position.y },
      data: {
        label:               n.data.label               || '',
        message:             n.data.message             || '',
        buttons:             (n.data.buttons || []).map(b => ({ handle: b.handle, label: b.label })),
        listButtonLabel:     n.data.listButtonLabel      || 'View',
        sectionTitle:        n.data.sectionTitle         || 'Options',
        rows:                (n.data.rows || []).map(r => ({ handle: r.handle, title: r.title, description: r.description || '' })),
        dynamicSource:       n.data.dynamicSource        || null,
        dynamicButtonLabel:  n.data.dynamicButtonLabel   || 'View',
        dynamicSectionTitle: n.data.dynamicSectionTitle  || 'Choose',
        noDataMessage:       n.data.noDataMessage        || '',
        displayMode:         n.data.displayMode          || 'list',
        inputVariable:       n.data.inputVariable        || 'userInput',
        fallbackMessage:     n.data.fallbackMessage      || '',
      },
    })),
    edges: rfEdges.map(e => ({
      id: e.id, source: e.source,
      sourceHandle: e.sourceHandle || null,
      target: e.target,
    })),
  };
}

function tpl(str, ctx) {
  if (!str) return '';
  return str.replace(/\{(\w+)\}/g, (_, k) => ctx[k] !== undefined ? ctx[k] : `{${k}}`);
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp mock preview
// ─────────────────────────────────────────────────────────────────────────────

function WaBubble({ text, type = 'bot', time }) {
  if (!text) return null;
  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm
        ${type === 'bot'
          ? 'bg-white text-slate-800 rounded-tl-sm'
          : 'bg-[#dcf8c6] text-slate-800 rounded-tr-sm'
        }`}
      >
        {text}
        {time && <span className="block text-[9px] text-slate-400 text-right mt-0.5">{time}</span>}
      </div>
    </div>
  );
}

function WaButton({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-center text-xs font-medium py-1.5 rounded-lg border transition-colors
        ${active ? 'bg-[#059669] text-white border-[#059669]' : 'bg-white text-[#059669] border-[#059669]/40 hover:bg-[#059669]/5'}`}
    >
      {label}
    </button>
  );
}

function WaListButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between text-xs font-medium py-2 px-3 bg-white rounded-lg border border-[#059669]/30 text-[#059669] hover:bg-[#059669]/5 transition-colors"
    >
      <span>{label}</span>
      <ChevronDown className="w-3 h-3" />
    </button>
  );
}

function WaListItem({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-xs"
    >
      <div className="font-medium text-slate-800">{title}</div>
      {desc && <div className="text-slate-400 text-[10px]">{desc}</div>}
    </button>
  );
}

function WaExpandedList({ rows, sectionTitle, onPick, onClose }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 z-20 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-600">{sectionTitle || 'Options'}</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-3 h-3 text-slate-400" /></button>
      </div>
      {rows.map((r, i) => (
        <WaListItem key={i} title={r.title} desc={r.description} onClick={() => onPick(r)} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live WhatsApp Preview Panel
// ─────────────────────────────────────────────────────────────────────────────

function LivePreview({ nodes, edges, cities, treks, departures }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [ctx, setCtx] = useState({});
  const [expandedList, setExpandedList] = useState(null);
  const [running, setRunning] = useState(false);
  const [previewInput, setPreviewInput] = useState('');
  const chatRef = useRef(null);

  const getNode = useCallback(id => nodes.find(n => n.id === id), [nodes]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory]);

  const pushBot = useCallback((text) => {
    if (!text) return;
    setChatHistory(h => [...h, { type: 'bot', text, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
  }, []);

  const pushUser = useCallback((text) => {
    setChatHistory(h => [...h, { type: 'user', text, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
  }, []);

  const buildDynamicRows = useCallback((node, simCtx) => {
    const src = node.data?.dynamicSource;
    if (src === 'cities') {
      return (cities || []).filter(c => c.isActive !== false).map(c => ({ id: c._id, title: c.name, desc: c.state || '' }));
    }
    if (src === 'treks') {
      return (treks || []).filter(t => t.isActive !== false).slice(0, 10).map(t => ({ id: t._id, title: t.name, desc: `from Rs.${t.price || 'N/A'}` }));
    }
    if (src === 'dates') {
      const deps = (departures || []).filter(d => simCtx.cityId ? d.cityId === simCtx.cityId : true);
      const dateMap = new Map();
      deps.forEach(d => {
        if (!d.startDate) return;
        const ds = d.startDate.split('T')[0];
        if (!dateMap.has(ds)) dateMap.set(ds, { ds, count: 1 });
        else dateMap.get(ds).count++;
      });
      return Array.from(dateMap.values()).map(d => ({ id: d.ds, title: fmtDate(d.ds), desc: `${d.count} trip${d.count > 1 ? 's' : ''}` }));
    }
    if (src === 'departures' || src === 'treks_on_date') {
      const deps = (departures || []).filter(d => {
        if (simCtx.trekId && d.trekId !== simCtx.trekId) return false;
        if (simCtx.cityId && d.cityId !== simCtx.cityId) return false;
        return d.status === 'Open' || d.status === 'Almost Full';
      });
      return deps.slice(0, 10).map(d => ({ id: d._id, title: d.trekName || 'Trek', desc: `${fmtDate(d.startDate)} - Rs.${d.price}` }));
    }
    return [];
  }, [cities, treks, departures]);

  const executeNode = useCallback((node, simCtx) => {
    if (!node) return;
    const d = node.data || {};
    const msg = tpl(d.message || '', simCtx);

    if (node.type === 'start' || node.type === 'text') {
      if (msg) pushBot(msg);
      setCurrentNodeId(node.id);
      if (node.type === 'start' || node.type === 'text') {
        const next = edges.find(e => e.source === node.id);
        if (next) {
          const nextNode = nodes.find(n => n.id === next.target);
          if (nextNode) setTimeout(() => executeNode(nextNode, simCtx), 600);
        }
      }
    } else if (node.type === 'buttons' || node.type === 'list' || node.type === 'dynamic_list' || node.type === 'collect_input') {
      if (msg) pushBot(msg);
      setCurrentNodeId(node.id);
    } else if (node.type === 'end') {
      if (msg) pushBot(msg);
      setCurrentNodeId(null);
    }
  }, [edges, nodes, pushBot]);

  const startPreview = useCallback(() => {
    setChatHistory([]);
    setCurrentNodeId(null);
    setCtx({});
    setExpandedList(null);
    setPreviewInput('');
    setRunning(true);
    pushUser('hi');
    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) setTimeout(() => executeNode(startNode, {}), 400);
    else pushBot('No Start node found. Add one from the palette.');
  }, [nodes, executeNode, pushUser, pushBot]);

  const handleButtonTap = useCallback((btn) => {
    const curNode = getNode(currentNodeId);
    if (!curNode) return;
    pushUser(btn.label);
    const edge = edges.find(e => e.source === curNode.id && e.sourceHandle === btn.handle);
    if (edge) {
      const next = nodes.find(n => n.id === edge.target);
      if (next) setTimeout(() => executeNode(next, ctx), 400);
    }
  }, [currentNodeId, getNode, edges, nodes, ctx, pushUser, executeNode]);

  const handleListOpen = useCallback((node) => {
    const d = node.data || {};
    if (node.type === 'list') {
      setExpandedList({
        rows: (d.rows || []).map(r => ({ handle: r.handle, title: tpl(r.title, ctx), description: tpl(r.description || '', ctx) })),
        sectionTitle: d.sectionTitle || 'Options',
        onPick: (row) => {
          setExpandedList(null);
          pushUser(row.title);
          const edge = edges.find(e => e.source === node.id && e.sourceHandle === row.handle) || edges.find(e => e.source === node.id);
          if (edge) {
            const next = nodes.find(n => n.id === edge.target);
            if (next) setTimeout(() => executeNode(next, ctx), 400);
          }
        },
      });
    } else if (node.type === 'dynamic_list') {
      const rows = buildDynamicRows(node, ctx);
      if (!rows.length) {
        pushBot(tpl(d.noDataMessage || 'No options available right now.', ctx));
        setCurrentNodeId(null);
        return;
      }
      setExpandedList({
        rows: rows.map(r => ({ handle: r.id, title: r.title, description: r.desc })),
        sectionTitle: d.dynamicSectionTitle || 'Options',
        onPick: (row) => {
          setExpandedList(null);
          pushUser(row.title);
          const src = d.dynamicSource;
          let newCtx = { ...ctx };
          if (src === 'cities') {
            const city = (cities || []).find(c => c._id === row.handle);
            newCtx = { ...newCtx, cityId: row.handle, cityName: city?.name || row.title };
          } else if (src === 'treks') {
            const trek = (treks || []).find(t => t._id === row.handle);
            newCtx = { ...newCtx, trekId: row.handle, trekName: trek?.name || row.title };
          } else if (src === 'dates') {
            newCtx = { ...newCtx, selectedDate: row.handle, formattedDate: fmtDate(row.handle) };
          } else if (src === 'departures' || src === 'treks_on_date') {
            newCtx = { ...newCtx, departureId: row.handle };
            pushBot('Departure selected! Payment link fires here in the live WhatsApp bot.');
            setCurrentNodeId(null);
            setCtx(newCtx);
            return;
          }
          setCtx(newCtx);
          const edge = edges.find(e => e.source === node.id);
          if (edge) {
            const next = nodes.find(n => n.id === edge.target);
            if (next) setTimeout(() => executeNode(next, newCtx), 400);
          }
        },
      });
    }
  }, [ctx, buildDynamicRows, edges, nodes, executeNode, pushUser, pushBot, cities, treks]);

  const handleSendText = () => {
    if (!previewInput.trim()) return;
    const curNode = getNode(currentNodeId);
    pushUser(previewInput.trim());
    if (curNode?.type === 'collect_input') {
      const varName = curNode.data?.inputVariable || 'userInput';
      const newCtx = { ...ctx, [varName]: previewInput.trim() };
      setCtx(newCtx);
      setPreviewInput('');
      const edge = edges.find(e => e.source === curNode.id);
      if (edge) {
        const next = nodes.find(n => n.id === edge.target);
        if (next) setTimeout(() => executeNode(next, newCtx), 400);
      }
    } else {
      setPreviewInput('');
    }
  };

  const curNode = getNode(currentNodeId);
  const curData = curNode?.data || {};

  return (
    <div className="flex flex-col bg-white border-l border-slate-200 shrink-0" style={{ width: 300, height: '100%' }}>
      {/* WA header bar */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ background: '#075e54' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Live Preview</p>
            <p className="text-[10px] text-white/60">click to interact</p>
          </div>
        </div>
        <button onClick={startPreview}
          className="flex items-center gap-1 text-xs text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors font-medium">
          <RefreshCw className="w-3 h-3" /> Restart
        </button>
      </div>

      {/* Chat */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-2.5 py-2.5 relative"
        style={{ background: '#e5ddd5' }}
      >
        {!running && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Play className="w-8 h-8 text-slate-400" />
            <p className="text-xs text-slate-500 text-center px-4">Press <strong>Restart</strong> to simulate the WhatsApp conversation</p>
          </div>
        )}
        {chatHistory.map((m, i) => (
          <WaBubble key={i} text={m.text} type={m.type} time={m.time} />
        ))}

        {/* Buttons */}
        {curNode?.type === 'buttons' && (
          <div className="space-y-1.5 mt-2">
            {(curData.buttons || []).map(btn => (
              <WaButton key={btn.handle} label={btn.label} onClick={() => handleButtonTap(btn)} />
            ))}
          </div>
        )}

        {/* Dynamic list — buttons mode: show items as inline WA buttons (max 3) */}
        {curNode?.type === 'dynamic_list' && curData.displayMode === 'buttons' && !expandedList && (() => {
          const rows = buildDynamicRows(curNode, ctx).slice(0, 3);
          if (!rows.length) return null;
          return (
            <div className="space-y-1.5 mt-2">
              {rows.map(r => (
                <WaButton key={r.id} label={r.title} onClick={() => {
                  pushUser(r.title);
                  const src = curData.dynamicSource;
                  let newCtx = { ...ctx };
                  if (src === 'cities') {
                    const city = (cities || []).find(c => c._id === r.id);
                    newCtx = { ...newCtx, cityId: r.id, cityName: city?.name || r.title };
                  } else if (src === 'treks') {
                    const trek = (treks || []).find(t => t._id === r.id);
                    newCtx = { ...newCtx, trekId: r.id, trekName: trek?.name || r.title };
                  } else if (src === 'dates') {
                    newCtx = { ...newCtx, selectedDate: r.id, formattedDate: r.title };
                  } else if (src === 'departures' || src === 'treks_on_date') {
                    newCtx = { ...newCtx, departureId: r.id };
                    pushBot('Departure selected! Payment flow fires here.');
                    setCtx(newCtx);
                    setCurrentNodeId(null);
                    return;
                  }
                  setCtx(newCtx);
                  const edge = edges.find(e => e.source === curNode.id);
                  if (edge) {
                    const next = nodes.find(n => n.id === edge.target);
                    if (next) setTimeout(() => executeNode(next, newCtx), 400);
                  }
                }} />
              ))}
              {buildDynamicRows(curNode, ctx).length > 3 && (
                <p className="text-[9px] text-slate-400 text-center">+{buildDynamicRows(curNode, ctx).length - 3} more (use List mode to show all)</p>
              )}
            </div>
          );
        })()}

        {/* List open button */}
        {(curNode?.type === 'list' || (curNode?.type === 'dynamic_list' && curData.displayMode !== 'buttons')) && !expandedList && (
          <div className="mt-2">
            <WaListButton
              label={curNode.type === 'list' ? curData.listButtonLabel || 'View Options' : curData.dynamicButtonLabel || 'Select'}
              onClick={() => handleListOpen(curNode)}
            />
          </div>
        )}

        {/* Expanded list overlay */}
        {expandedList && (
          <WaExpandedList
            rows={expandedList.rows}
            sectionTitle={expandedList.sectionTitle}
            onPick={expandedList.onPick}
            onClose={() => setExpandedList(null)}
          />
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-2 py-2 border-t border-slate-200 flex gap-2 items-center" style={{ background: '#f0f0f0' }}>
        {curNode?.type === 'collect_input' && running ? (
          <>
            <input
              type="text"
              value={previewInput}
              onChange={e => setPreviewInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendText()}
              placeholder="Type your reply…"
              className="flex-1 text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 focus:outline-none"
            />
            <button onClick={handleSendText}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#059669' }}>
              <Check className="w-3 h-3 text-white" />
            </button>
          </>
        ) : (
          <p className="text-[10px] text-slate-400 px-2 text-center flex-1">
            {!running ? 'Press Restart to begin' : curNode ? 'Pick an option above' : 'Flow complete'}
          </p>
        )}
      </div>

      {/* Context debug panel */}
      {running && Object.keys(ctx).length > 0 && (
        <div className="shrink-0 px-3 py-2 text-[10px] font-mono max-h-20 overflow-y-auto" style={{ background: '#1e293b', color: '#94a3b8' }}>
          <p className="text-slate-500 mb-0.5">SESSION</p>
          {Object.entries(ctx).map(([k, v]) => (
            <div key={k}><span style={{ color: '#67e8f9' }}>{k}</span> = <span style={{ color: '#86efac' }}>{v}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Departure Manager Modal
// ─────────────────────────────────────────────────────────────────────────────

function DepartureModal({ cities, treks, onClose, onSaved }) {
  const toast = useToast();
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedTrekId, setSelectedTrekId] = useState('');
  const [editingDep, setEditingDep] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    startDate: '', endDate: '', duration: '', nights: '', days: '',
    price: '', capacity: 50, status: 'Open',
    itinerary: '', thingsToCarry: '', contact: '', meetingPoint: '', transport: '',
    imageUrl: '', brochureUrl: '',
    whatsappGroupInviteLink: '', whatsappGroupName: '',
  });

  const { data: depsData, refetch: refetchDeps, loading: depsLoading } = useQuery(GET_DEPARTURES, {
    variables: { trekId: selectedTrekId || undefined, cityId: !selectedTrekId && selectedCityId ? selectedCityId : undefined },
    skip: !selectedTrekId && !selectedCityId,
    fetchPolicy: 'network-only',
  });

  const [createDeparture, { loading: creating }] = useMutation(CREATE_DEPARTURE);
  const [updateDeparture, { loading: updating }] = useMutation(UPDATE_DEPARTURE);
  const [deleteDeparture, { loading: deleting }] = useMutation(DELETE_DEPARTURE);

  const departures = depsData?.getDepartures || [];

  const openCreate = () => {
    setEditingDep(null);
    setForm({
      startDate: '', endDate: '', duration: '', nights: '', days: '',
      price: '', capacity: 50, status: 'Open', itinerary: '', thingsToCarry: '',
      contact: '', meetingPoint: '', transport: '', imageUrl: '', brochureUrl: '',
      whatsappGroupInviteLink: '', whatsappGroupName: '',
    });
    setShowForm(true);
  };

  const openEdit = (dep) => {
    setEditingDep(dep);
    setForm({
      startDate:    dep.startDate ? dep.startDate.slice(0, 10) : '',
      endDate:      dep.endDate   ? dep.endDate.slice(0, 10)   : '',
      duration:     dep.duration  || '',
      nights:       dep.nights    || '',
      days:         dep.days      || '',
      price:        dep.price     || '',
      capacity:     dep.capacity  || 50,
      status:       dep.status    || 'Open',
      itinerary:    dep.itinerary || '',
      thingsToCarry: dep.thingsToCarry || '',
      contact:      dep.contact   || '',
      meetingPoint: dep.meetingPoint || '',
      transport: dep.transport || '',
      imageUrl: dep.imageUrl || '',
      brochureUrl: dep.brochureUrl || '',
      whatsappGroupInviteLink: dep.whatsappGroupInviteLink || '',
      whatsappGroupName: dep.whatsappGroupName || '',
    });
    setShowForm(true);
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!selectedTrekId) { toast.error('Select a trek first'); return; }
    if (!form.startDate) { toast.error('Start date is required'); return; }
    if (!form.price)     { toast.error('Price is required'); return; }
    const trek = treks.find(t => t._id === selectedTrekId);
    const city = cities.find(c => c._id === selectedCityId);
    const input = {
      trekId:    selectedTrekId,
      trekName:  trek?.name || '',
      cityId:    selectedCityId || '',
      cityName:  city?.name || '',
      startDate: form.startDate,
      endDate:   form.endDate   || undefined,
      duration:  form.duration  || undefined,
      nights:    form.nights   ? Number(form.nights)   : undefined,
      days:      form.days     ? Number(form.days)     : undefined,
      price:     Number(form.price),
      capacity:  Number(form.capacity) || 50,
      status:    form.status,
      itinerary:    form.itinerary    || undefined,
      thingsToCarry: form.thingsToCarry || undefined,
      contact:      form.contact      || undefined,
      meetingPoint: form.meetingPoint || undefined,
      transport: form.transport?.trim() || undefined,
      imageUrl: form.imageUrl || undefined,
      brochureUrl: form.brochureUrl || undefined,
      whatsappGroupInviteLink: form.whatsappGroupInviteLink?.trim() || undefined,
      whatsappGroupName: form.whatsappGroupName?.trim() || undefined,
    };
    try {
      if (editingDep) {
        await updateDeparture({ variables: { id: editingDep._id, input } });
        toast.success('Departure updated');
      } else {
        await createDeparture({ variables: { input } });
        toast.success('Departure created');
      }
      setShowForm(false);
      refetchDeps();
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this departure?')) return;
    try {
      await deleteDeparture({ variables: { id } });
      toast.success('Deleted');
      refetchDeps();
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const filteredTreks = selectedCityId
    ? (treks || []).filter(t => !t.cityId || t.cityId === selectedCityId)
    : (treks || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CalendarPlus className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Departure Manager</h2>
              <p className="text-xs text-slate-500">Create departures that appear live on WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">City</label>
              <select value={selectedCityId} onChange={e => { setSelectedCityId(e.target.value); setSelectedTrekId(''); }} className="select-field text-sm">
                <option value="">All Cities</option>
                {(cities || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Trek <span className="text-red-400">*</span></label>
              <select value={selectedTrekId} onChange={e => setSelectedTrekId(e.target.value)} className="select-field text-sm">
                <option value="">Select a trek to view departures</option>
                {filteredTreks.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {(selectedTrekId || selectedCityId) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{departures.length} Departure{departures.length !== 1 ? 's' : ''}</p>
                <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1 py-1.5 px-3">
                  <Plus className="w-3.5 h-3.5" /> Add Departure
                </button>
              </div>
              {depsLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : departures.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CalendarPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No departures yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {departures.map(dep => (
                    <div key={dep._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                            ${dep.status === 'Open' ? 'bg-green-100 text-green-700' :
                              dep.status === 'Almost Full' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'}`}>{dep.status}</span>
                          <span className="text-xs font-semibold text-slate-700 truncate">{dep.trekName}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {fmtDate(dep.startDate)} · Rs.{dep.price} · {dep.booked || 0}/{dep.capacity}
                          {dep.cityName && <> · {dep.cityName}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button onClick={() => openEdit(dep)} className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-500">
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(dep._id)} disabled={deleting} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{editingDep ? 'Edit Departure' : 'New Departure'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={f('startDate')} className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={f('endDate')} className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Price (Rs.) *</label>
                  <input type="number" value={form.price} onChange={f('price')} placeholder="e.g. 3500" className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Capacity</label>
                  <input type="number" value={form.capacity} onChange={f('capacity')} placeholder="50" className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Nights</label>
                  <input type="number" value={form.nights} onChange={f('nights')} placeholder="2" className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Days</label>
                  <input type="number" value={form.days} onChange={f('days')} placeholder="3" className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Duration (text)</label>
                  <input type="text" value={form.duration} onChange={f('duration')} placeholder="2N/3D" className="input-field text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
                  <select value={form.status} onChange={f('status')} className="select-field text-xs">
                    <option value="Open">Open</option>
                    <option value="Almost Full">Almost Full</option>
                    <option value="Full">Full</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Meeting Point</label>
                  <input type="text" value={form.meetingPoint} onChange={f('meetingPoint')} placeholder="Where to meet" className="input-field text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Contact</label>
                  <input type="text" value={form.contact} onChange={f('contact')} placeholder="+91 9999999999" className="input-field text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Transport</label>
                  <input type="text" value={form.transport} onChange={f('transport')} placeholder="e.g. Bus from Pune / Self drive" className="input-field text-xs" />
                </div>
                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FileUpload
                    folder="departures"
                    accept="image"
                    label="Departure Image"
                    value={form.imageUrl || ''}
                    onChange={(url) => setForm(p => ({ ...p, imageUrl: url }))}
                  />
                  <FileUpload
                    folder="documents"
                    accept="pdf"
                    label="Departure Brochure"
                    value={form.brochureUrl || ''}
                    onChange={(url) => setForm(p => ({ ...p, brochureUrl: url }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">WhatsApp Group Invite Link</label>
                  <input type="text" value={form.whatsappGroupInviteLink} onChange={f('whatsappGroupInviteLink')} placeholder="https://chat.whatsapp.com/xxxxxxxxxxxx" className="input-field text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">WhatsApp Group Name (optional)</label>
                  <input type="text" value={form.whatsappGroupName} onChange={f('whatsappGroupName')} placeholder="e.g. Rajmachi Batch 20 Apr" className="input-field text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Itinerary</label>
                  <textarea rows={3} value={form.itinerary} onChange={f('itinerary')} placeholder="Day 1: Arrive..." className="input-field text-xs resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Things to Carry</label>
                  <textarea rows={2} value={form.thingsToCarry} onChange={f('thingsToCarry')} placeholder="Water bottle, trekking shoes..." className="input-field text-xs resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={creating || updating}
                  className="btn-primary text-xs flex items-center gap-1.5 flex-1 justify-center">
                  {(creating || updating) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {editingDep ? 'Update Departure' : 'Create Departure'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary text-xs px-4">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Custom node components
// ─────────────────────────────────────────────────────────────────────────────

function NodeShell({ id, type, data, selected, children }) {
  const meta = NODE_TYPES_META[type] || NODE_TYPES_META.text;
  const Icon = meta.icon;
  return (
    <div
      style={{
        background: meta.bg,
        border: `2px solid ${selected ? meta.color : meta.border}`,
        boxShadow: selected ? `0 0 0 3px ${meta.color}33, 0 4px 20px rgba(0,0,0,.15)` : '0 2px 8px rgba(0,0,0,.07)',
      }}
      className="rounded-xl min-w-[200px] max-w-[260px] text-xs transition-shadow"
    >
      <div style={{ background: meta.color }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-[10px]">
        <Icon className="w-3.5 h-3.5 text-white shrink-0" />
        <span className="font-semibold text-white text-xs leading-none truncate">{data.label || meta.label}</span>
      </div>
      <div className="px-3 py-2 space-y-1">{children}</div>
    </div>
  );
}

function Msg({ msg }) {
  if (!msg) return <p className="text-slate-400 italic text-[10px]">Click to configure…</p>;
  return <p className="text-slate-700 line-clamp-2 leading-relaxed">{msg}</p>;
}

function StartNode({ id, data, selected }) {
  return (
    <NodeShell id={id} type="start" data={data} selected={selected}>
      <p className="text-slate-400 italic text-[10px]">Triggered by: hi, hello, hey</p>
      <Handle type="source" position={Position.Bottom}
        style={{ background: '#10b981', border: '2px solid #fff', width: 10, height: 10 }} />
    </NodeShell>
  );
}

function TextNode({ id, data, selected }) {
  return (
    <NodeShell id={id} type="text" data={data} selected={selected}>
      <Handle type="target" position={Position.Top}
        style={{ background: '#3b82f6', border: '2px solid #fff', width: 10, height: 10 }} />
      <Msg msg={data.message} />
      <Handle type="source" position={Position.Bottom}
        style={{ background: '#3b82f6', border: '2px solid #fff', width: 10, height: 10 }} />
    </NodeShell>
  );
}

function ButtonsNode({ id, data, selected }) {
  const buttons = data.buttons || [];
  return (
    <NodeShell id={id} type="buttons" data={data} selected={selected}>
      <Handle type="target" position={Position.Top}
        style={{ background: '#f59e0b', border: '2px solid #fff', width: 10, height: 10 }} />
      <Msg msg={data.message} />
      <div className="flex flex-col gap-1 mt-1">
        {buttons.length === 0
          ? <p className="text-slate-400 italic text-[10px]">No buttons — click to add</p>
          : buttons.slice(0, 3).map(b => (
              <div key={b.handle} className="relative flex items-center bg-white border border-amber-200 rounded px-2 py-0.5 text-amber-700 pr-5">
                <span className="truncate text-[10px] font-medium">{b.label || 'Button'}</span>
                <Handle type="source" position={Position.Right} id={b.handle}
                  style={{ background: '#f59e0b', border: '2px solid #fff', width: 8, height: 8, right: -10, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            ))}
      </div>
    </NodeShell>
  );
}

function ListNode({ id, data, selected }) {
  const rows = data.rows || [];
  return (
    <NodeShell id={id} type="list" data={data} selected={selected}>
      <Handle type="target" position={Position.Top}
        style={{ background: '#8b5cf6', border: '2px solid #fff', width: 10, height: 10 }} />
      <Msg msg={data.message} />
      {rows.length > 0 ? rows.slice(0, 3).map(r => (
        <div key={r.handle} className="relative flex items-center bg-white border border-violet-200 rounded px-2 py-0.5 text-violet-700 pr-5">
          <span className="truncate text-[10px] font-medium">{r.title || 'Row'}</span>
          <Handle type="source" position={Position.Right} id={r.handle}
            style={{ background: '#8b5cf6', border: '2px solid #fff', width: 8, height: 8, right: -10, top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      )) : <Handle type="source" position={Position.Bottom}
        style={{ background: '#8b5cf6', border: '2px solid #fff', width: 10, height: 10 }} />}
    </NodeShell>
  );
}

function DynamicListNode({ id, data, selected }) {
  const src = DYNAMIC_SOURCES.find(s => s.value === data.dynamicSource);
  const isBtns = data.displayMode === 'buttons';
  return (
    <NodeShell id={id} type="dynamic_list" data={data} selected={selected}>
      <Handle type="target" position={Position.Top}
        style={{ background: '#06b6d4', border: '2px solid #fff', width: 10, height: 10 }} />
      <Msg msg={data.message} />
      <div className="flex items-center gap-1 flex-wrap">
        {src
          ? <div className="bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5 text-cyan-700 text-[10px] font-medium">{src.label}</div>
          : <p className="text-slate-400 italic text-[10px]">No source</p>}
        <div className={`rounded px-1.5 py-0.5 text-[9px] font-semibold border ${isBtns ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          {isBtns ? '⬜ Buttons' : '≡ List'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom}
        style={{ background: '#06b6d4', border: '2px solid #fff', width: 10, height: 10 }} />
    </NodeShell>
  );
}

function CollectInputNode({ id, data, selected }) {
  return (
    <NodeShell id={id} type="collect_input" data={data} selected={selected}>
      <Handle type="target" position={Position.Top}
        style={{ background: '#ec4899', border: '2px solid #fff', width: 10, height: 10 }} />
      <Msg msg={data.message} />
      <p className="text-[10px] text-slate-400">saves as: <code className="bg-slate-100 px-0.5 rounded">{data.inputVariable || 'userInput'}</code></p>
      <Handle type="source" position={Position.Bottom}
        style={{ background: '#ec4899', border: '2px solid #fff', width: 10, height: 10 }} />
    </NodeShell>
  );
}

function EndNode({ id, data, selected }) {
  return (
    <NodeShell id={id} type="end" data={data} selected={selected}>
      <Handle type="target" position={Position.Top}
        style={{ background: '#ef4444', border: '2px solid #fff', width: 10, height: 10 }} />
      <Msg msg={data.message} />
    </NodeShell>
  );
}

const NODE_COMPONENTS = {
  start: StartNode, text: TextNode, buttons: ButtonsNode, list: ListNode,
  dynamic_list: DynamicListNode, collect_input: CollectInputNode, end: EndNode,
};

// ─── Deletable Edge ──────────────────────────────────────────────────────────
function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, selected }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const { setEdges } = useReactFlow();
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {/* invisible wide hit-area */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={18}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} />
      {(hovered || selected) && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all', position: 'absolute', zIndex: 10 }}
            className="nodrag nopan"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <button
              onClick={() => setEdges?.(es => es.filter(e => e.id !== id))}
              className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors text-[10px] font-bold"
              title="Delete connection"
            >✕</button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
const EDGE_TYPES = { deletable: DeletableEdge };


// ─────────────────────────────────────────────────────────────────────────────
// Properties Panel
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, hint, compact, action, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
          {hint && <span className="ml-1 text-slate-400 font-normal normal-case text-[9px]">({hint})</span>}
        </label>
        {action && (
          <button onClick={action.fn} className={`text-[10px] font-semibold ${action.color} hover:opacity-70`}>{action.label}</button>
        )}
      </div>
      {children}
    </div>
  );
}

function PropertiesPanel({ node, onChange, onClose, onDelete }) {
  if (!node) return null;
  const meta = NODE_TYPES_META[node.type] || {};
  const Icon = meta.icon || Settings;
  const d = node.data || {};
  const set = (field, val) => onChange({ ...d, [field]: val });

  const buttons = d.buttons || [];
  const rows    = d.rows    || [];

  const addButton = () => {
    if (buttons.length >= 3) return;
    set('buttons', [...buttons, { handle: `btn_${Date.now()}`, label: 'Option' }]);
  };
  const updBtn = (i, field, val) => set('buttons', buttons.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
  const remBtn = (i) => set('buttons', buttons.filter((_, idx) => idx !== i));

  const addRow  = () => set('rows', [...rows, { handle: `row_${Date.now()}`, title: 'Option', description: '' }]);
  const updRow  = (i, field, val) => set('rows', rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const remRow  = (i) => set('rows', rows.filter((_, idx) => idx !== i));

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b-2 shrink-0"
        style={{ background: meta.bg, borderBottomColor: meta.border }}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
          <span className="font-semibold text-slate-800 text-sm">{meta.label}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded"><X className="w-4 h-4 text-slate-600" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <Field label="Node Label">
          <input type="text" value={d.label || ''} onChange={e => set('label', e.target.value)}
            placeholder={meta.label} className="input-field text-sm" />
        </Field>

        {node.type !== 'start' && (
          <Field label="Message" hint="use {cityName}, {trekName}, {price}">
            <textarea
              rows={node.type === 'buttons' || node.type === 'collect_input' ? 2 : 3}
              value={d.message || ''} onChange={e => set('message', e.target.value)}
              placeholder="Message text…"
              className="input-field text-xs resize-none leading-relaxed" />
          </Field>
        )}

        {node.type === 'buttons' && (
          <Field label={`Buttons (${buttons.length}/3)`}
            action={buttons.length < 3 ? { label: '+ Add', color: 'text-amber-600', fn: addButton } : null}>
            <div className="space-y-2">
              {buttons.map((btn, i) => (
                <div key={btn.handle} className="flex gap-1.5 items-center">
                  <input type="text" value={btn.label} maxLength={20}
                    onChange={e => updBtn(i, 'label', e.target.value)}
                    placeholder="Button label" className="input-field text-xs flex-1" />
                  <button onClick={() => remBtn(i)} className="p-1 text-slate-300 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {buttons.length === 0 && <p className="text-xs text-slate-400">Click + Add to add buttons</p>}
            </div>
            <p className="text-[10px] text-amber-600 mt-1">Draw edges from each button handle on the right</p>
          </Field>
        )}

        {node.type === 'list' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Button label" compact>
                <input type="text" maxLength={20} value={d.listButtonLabel || ''} onChange={e => set('listButtonLabel', e.target.value)}
                  className="input-field text-xs" placeholder="View" />
              </Field>
              <Field label="Section title" compact>
                <input type="text" value={d.sectionTitle || ''} onChange={e => set('sectionTitle', e.target.value)}
                  className="input-field text-xs" placeholder="Options" />
              </Field>
            </div>
            <Field label={`Rows (${rows.length})`} action={{ label: '+ Add Row', color: 'text-violet-600', fn: addRow }}>
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={row.handle} className="p-2 bg-violet-50 border border-violet-200 rounded space-y-1.5">
                    <div className="flex gap-1">
                      <input type="text" value={row.title} maxLength={24}
                        onChange={e => updRow(i, 'title', e.target.value)}
                        placeholder="Title (24 chars)" className="input-field text-xs flex-1" />
                      <button onClick={() => remRow(i)} className="p-1 text-slate-300 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input type="text" value={row.description || ''} maxLength={72}
                      onChange={e => updRow(i, 'description', e.target.value)}
                      placeholder="Description (72 chars)" className="input-field text-xs" />
                    <p className="text-[9px] text-slate-400">handle: <code>{row.handle}</code></p>
                  </div>
                ))}
              </div>
            </Field>
          </>
        )}

        {node.type === 'dynamic_list' && (
          <>
            <Field label="Data Source">
              <select value={d.dynamicSource || ''} onChange={e => set('dynamicSource', e.target.value)} className="select-field text-sm">
                <option value="">— choose source —</option>
                {DYNAMIC_SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {d.dynamicSource && (() => {
                const h = DYNAMIC_SOURCES.find(s => s.value === d.dynamicSource)?.hint;
                return h ? <p className="text-[10px] text-cyan-600 mt-1">Requires: {h}</p> : null;
              })()}
            </Field>

            <Field label="Display as" hint="Buttons = max 3 inline replies. List = scrollable drawer (no limit).">
              <div className="flex gap-2">
                {[{ val: 'buttons', icon: '⬜', label: 'Buttons' }, { val: 'list', icon: '≡', label: 'List' }].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => set('displayMode', opt.val)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      (d.displayMode || 'list') === opt.val
                        ? 'bg-cyan-500 border-cyan-500 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-300'
                    }`}
                  >
                    <span>{opt.icon}</span> {opt.label}
                  </button>
                ))}
              </div>
              {(d.displayMode || 'list') === 'buttons' && (
                <p className="text-[10px] text-amber-600 mt-1.5">Only the first 3 options are shown as buttons.</p>
              )}
            </Field>

            {(d.displayMode || 'list') === 'list' && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Open button" compact>
                  <input type="text" maxLength={20} value={d.dynamicButtonLabel || ''} onChange={e => set('dynamicButtonLabel', e.target.value)}
                    className="input-field text-xs" placeholder="View" />
                </Field>
                <Field label="Section title" compact>
                  <input type="text" value={d.dynamicSectionTitle || ''} onChange={e => set('dynamicSectionTitle', e.target.value)}
                    className="input-field text-xs" placeholder="Choose" />
                </Field>
              </div>
            )}
            <Field label="No data message">
              <input type="text" value={d.noDataMessage || ''} onChange={e => set('noDataMessage', e.target.value)}
                className="input-field text-xs" placeholder="No options available." />
            </Field>
            {(d.dynamicSource === 'departures' || d.dynamicSource === 'treks_on_date') && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-[10px] text-green-700 flex gap-1.5">
                <Check className="w-3 h-3 shrink-0 mt-0.5" />
                Selecting a departure triggers the payment flow automatically.
              </div>
            )}
          </>
        )}

        {node.type === 'collect_input' && (
          <Field label="Save as variable">
            <input type="text" value={d.inputVariable || ''} onChange={e => set('inputVariable', e.target.value)}
              className="input-field text-xs font-mono" placeholder="peopleCount" />
            <p className="text-[10px] text-slate-400 mt-1">Reference in later nodes as <code className="bg-slate-100 px-0.5 rounded">{'{peopleCount}'}</code></p>
          </Field>
        )}

        {['buttons', 'list', 'collect_input', 'dynamic_list'].includes(node.type) && (
          <Field label="Fallback message">
            <input type="text" value={d.fallbackMessage || ''} onChange={e => set('fallbackMessage', e.target.value)}
              className="input-field text-xs" placeholder="Please choose a valid option." />
          </Field>
        )}
      </div>

      {node.type !== 'start' && (
        <div className="px-4 py-3 border-t border-slate-100 shrink-0">
          <button onClick={() => onDelete(node.id)} className="btn-danger w-full flex items-center justify-center gap-1.5 text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Delete Node
          </button>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Node Palette
// ─────────────────────────────────────────────────────────────────────────────

function NodePalette({ onAdd }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-48">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 pb-2">Drag or click to add</p>
      <div className="space-y-1">
        {Object.entries(NODE_TYPES_META).filter(([t]) => t !== 'start').map(([type, meta]) => {
          const Icon = meta.icon;
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              draggable
              onDragStart={e => e.dataTransfer.setData('nodeType', type)}
              title={meta.desc}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-200"
            >
              <span className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                <Icon className="w-3 h-3" style={{ color: meta.color }} />
              </span>
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Default flow
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_NODES = [
  { id: 'start_1',              type: 'start',        position: { x: 300, y: 40  }, data: { label: 'Start' } },
  { id: 'dynlist_cities',       type: 'dynamic_list', position: { x: 230, y: 160 }, data: { label: 'Choose City',        message: 'Where are you joining from?',               dynamicSource: 'cities',        displayMode: 'buttons', dynamicButtonLabel: 'Select City',  dynamicSectionTitle: 'Available Cities',  noDataMessage: 'No cities available.' } },
  { id: 'btn_browse',           type: 'buttons',      position: { x: 190, y: 330 }, data: { label: 'Browse Type',        message: 'How would you like to explore?',             buttons: [{ handle: 'browse_trek', label: 'Browse by Treks' }, { handle: 'browse_date', label: 'Browse by Dates' }] } },
  { id: 'dynlist_treks',        type: 'dynamic_list', position: { x: 20,  y: 520 }, data: { label: 'Trek List',          message: 'Available treks from {cityName}:',           dynamicSource: 'treks',         displayMode: 'list',    dynamicButtonLabel: 'View Treks',   dynamicSectionTitle: 'Available Treks',   noDataMessage: 'No treks right now.' } },
  { id: 'dynlist_dates',        type: 'dynamic_list', position: { x: 400, y: 520 }, data: { label: 'Date List',          message: 'Upcoming departure dates from {cityName}:',  dynamicSource: 'dates',         displayMode: 'list',    dynamicButtonLabel: 'View Dates',   dynamicSectionTitle: 'Dates',             noDataMessage: 'No dates right now.' } },
  { id: 'dynlist_departures_1', type: 'dynamic_list', position: { x: 20,  y: 700 }, data: { label: 'Departures by Trek', message: 'Departures for {trekName}:',                 dynamicSource: 'departures',    displayMode: 'list',    dynamicButtonLabel: 'View',         dynamicSectionTitle: 'Upcoming Dates',    noDataMessage: 'No departures available.' } },
  { id: 'dynlist_treks_date',   type: 'dynamic_list', position: { x: 400, y: 700 }, data: { label: 'Treks on Date',      message: 'Treks departing on {formattedDate}:',        dynamicSource: 'treks_on_date', displayMode: 'list',    dynamicButtonLabel: 'View Treks',   dynamicSectionTitle: 'Available Treks',   noDataMessage: 'No treks on that date.' } },
];

const DEFAULT_EDGES = [
  { id: 'e1', source: 'start_1',              sourceHandle: null,           target: 'dynlist_cities' },
  { id: 'e2', source: 'dynlist_cities',        sourceHandle: null,           target: 'btn_browse' },
  { id: 'e3', source: 'btn_browse',            sourceHandle: 'browse_trek',  target: 'dynlist_treks' },
  { id: 'e4', source: 'btn_browse',            sourceHandle: 'browse_date',  target: 'dynlist_dates' },
  { id: 'e5', source: 'dynlist_treks',         sourceHandle: null,           target: 'dynlist_departures_1' },
  { id: 'e6', source: 'dynlist_dates',         sourceHandle: null,           target: 'dynlist_treks_date' },
];


// ─────────────────────────────────────────────────────────────────────────────
// Canvas
// ─────────────────────────────────────────────────────────────────────────────

function FlowCanvas({ initialNodes, initialEdges, onSave, saving, cities, treks, departures }) {
  const rfWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showPalette, setShowPalette] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  // Keep selectedNode fresh when nodes change
  useEffect(() => {
    if (!selectedNode) return;
    const fresh = nodes.find(n => n.id === selectedNode.id);
    if (fresh) setSelectedNode(fresh);
    else setSelectedNode(null);
  }, [nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback(params => {
    setEdges(eds => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    }, eds));
  }, [setEdges]);

  const onNodeClick   = useCallback((_, n) => setSelectedNode(n), []);
  const onPaneClick   = useCallback(() => setSelectedNode(null),   []);

  const handleDataChange = useCallback((newData) => {
    if (!selectedNode) return;
    setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, data: newData } : n));
  }, [selectedNode, setNodes]);

  const deleteNode = useCallback((id) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const addNode = useCallback((type) => {
    const id  = newId();
    const pos = rfInstance
      ? rfInstance.screenToFlowPosition({ x: (rfWrapper.current?.clientWidth || 600) / 2, y: (rfWrapper.current?.clientHeight || 400) / 2 })
      : { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 };
    const nn  = { id, type, position: pos, data: { label: NODE_TYPES_META[type]?.label || type } };
    setNodes(ns => [...ns, nn]);
    setSelectedNode(nn);
  }, [rfInstance, setNodes]);

  const onDragOver = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop     = useCallback(e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    if (!type || !rfInstance) return;
    const b   = rfWrapper.current.getBoundingClientRect();
    const pos = rfInstance.screenToFlowPosition({ x: e.clientX - b.left, y: e.clientY - b.top });
    const nn  = { id: newId(), type, position: pos, data: { label: NODE_TYPES_META[type]?.label || type } };
    setNodes(ns => [...ns, nn]);
    setSelectedNode(nn);
  }, [rfInstance, setNodes]);

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: '100%' }} ref={rfWrapper}>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          onInit={setRfInstance} onDrop={onDrop} onDragOver={onDragOver}
          nodeTypes={NODE_COMPONENTS}
          edgeTypes={EDGE_TYPES}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'deletable',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
        >
          <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
          <Controls />
          <MiniMap
            nodeColor={n => NODE_TYPES_META[n.type]?.color || '#94a3b8'}
            maskColor="rgba(255,255,255,0.85)"
            className="shadow rounded-xl overflow-hidden border border-slate-200"
          />

          <Panel position="top-center">
            <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2">
              <button onClick={() => setShowPalette(p => !p)} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-2.5">
                <Plus className="w-3.5 h-3.5" /> Nodes
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <button onClick={() => setShowPreview(p => !p)} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-2.5">
                <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Hide' : 'Show'} Preview
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <button
                onClick={() => { const { nodes: n, edges: e } = buildFlowInput(nodes, edges); onSave(n, e); }}
                disabled={saving}
                className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving…' : 'Save Flow'}
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <span className="text-[10px] text-slate-400">{nodes.length}N · {edges.length}E</span>
            </div>
          </Panel>

          {showPalette && (
            <Panel position="top-left">
              <NodePalette onAdd={addNode} />
            </Panel>
          )}
        </ReactFlow>

        {/* Properties panel overlaid */}
        {selectedNode && (
          <div className="absolute inset-y-0 right-0 pointer-events-auto z-40" style={{ width: 320 }}>
            <PropertiesPanel
              node={selectedNode}
              onChange={handleDataChange}
              onClose={() => setSelectedNode(null)}
              onDelete={deleteNode}
            />
          </div>
        )}
      </div>

      {/* WhatsApp preview */}
      {showPreview && (
        <LivePreview
          nodes={nodes}
          edges={edges}
          cities={cities}
          treks={treks}
          departures={departures}
        />
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function FlowBuilderPage() {
  const toast = useToast();
  const [initialized, setInitialized] = useState(false);
  const [savedNodes, setSavedNodes] = useState(null);
  const [savedEdges, setSavedEdges] = useState(null);
  const [showDepModal, setShowDepModal] = useState(false);

  const { data: flowData, loading: flowLoading }                      = useQuery(GET_FLOW_DEFINITION, { fetchPolicy: 'cache-and-network' });
  const { data: citiesData }                                          = useQuery(GET_CITIES);
  const { data: treksData }                                           = useQuery(GET_TREKS);
  const { data: depsData, refetch: refetchDeps }                      = useQuery(GET_DEPARTURES, { variables: {}, fetchPolicy: 'cache-and-network' });

  const [saveFlowDefinition, { loading: saving }]                     = useMutation(SAVE_FLOW_DEFINITION, { refetchQueries: [{ query: GET_FLOW_DEFINITION }] });
  const [deleteFlowDefinition, { loading: deleting }]                 = useMutation(DELETE_FLOW_DEFINITION, { refetchQueries: [{ query: GET_FLOW_DEFINITION }] });

  const cities     = citiesData?.getCities   || [];
  const treks      = treksData?.getTreks     || [];
  const departures = depsData?.getDepartures || [];

  useEffect(() => {
    if (flowLoading) return;
    const def = flowData?.getFlowDefinition;
    if (def?.nodes?.length) {
      const c = stripTypename(def);
      setSavedNodes(c.nodes);
      setSavedEdges(c.edges);
    } else {
      setSavedNodes(DEFAULT_NODES);
      setSavedEdges(DEFAULT_EDGES);
    }
    setInitialized(true);
  }, [flowData, flowLoading]);

  const handleSave = async (nodes, edges) => {
    try {
      await saveFlowDefinition({ variables: { nodes, edges } });
      toast.success('Flow saved — changes are live on WhatsApp immediately!');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleDeleteFlow = async () => {
    if (!window.confirm('Delete this flow? The bot will fall back to default built-in handlers.')) return;
    try {
      await deleteFlowDefinition();
      setSavedNodes(DEFAULT_NODES);
      setSavedEdges(DEFAULT_EDGES);
      toast.success('Flow deleted.');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Braces className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight">WhatsApp Flow Builder</h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Design flows · Preview live · Manage departures</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-400 mr-2">
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {cities.length} cities</span>
            <span className="flex items-center gap-1"><Mountain className="w-3 h-3" /> {treks.length} treks</span>
            <span className="flex items-center gap-1"><CalendarPlus className="w-3 h-3" /> {departures.length} departures</span>
          </div>
          <button onClick={() => setShowDepModal(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <CalendarPlus className="w-3.5 h-3.5" /> Manage Departures
          </button>
          <button onClick={handleDeleteFlow} disabled={deleting}
            className="btn-secondary text-xs flex items-center gap-1.5 text-red-500 hover:bg-red-50 border-red-200">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Reset Flow
          </button>
        </div>
      </div>

      {/* Canvas */}
      {flowLoading && !initialized ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading flow…
        </div>
      ) : initialized ? (
        <ReactFlowProvider>
          <FlowCanvas
            key={`flow_${savedNodes?.length}_${savedEdges?.length}`}
            initialNodes={savedNodes || DEFAULT_NODES}
            initialEdges={savedEdges || DEFAULT_EDGES}
            onSave={handleSave}
            saving={saving}
            cities={cities}
            treks={treks}
            departures={departures}
          />
        </ReactFlowProvider>
      ) : null}

      {showDepModal && (
        <DepartureModal
          cities={cities}
          treks={treks}
          onClose={() => setShowDepModal(false)}
          onSaved={() => refetchDeps()}
        />
      )}
    </div>
  );
}
