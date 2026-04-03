import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const ForoComunidad = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para MODAL DE CREACIÓN
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevaMision, setNuevaMision] = useState({ titulo: '', contenido: '' });
    const [archivo, setArchivo] = useState(null);

    // Estados para MODAL DE EDICIÓN DE POSTS
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [misionAEditar, setMisionAEditar] = useState({ id_post: null, titulo: '', contenido: '' });
    const [archivoEdicion, setArchivoEdicion] = useState(null);

    const [misionSeleccionada, setMisionSeleccionada] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [enviandoComentario, setEnviandoComentario] = useState(false);

    // 🚩 NUEVOS ESTADOS: EDICIÓN EN LÍNEA DE COMENTARIOS
    const [comentarioEditando, setComentarioEditando] = useState(null);
    const [textoComentarioEditado, setTextoComentarioEditado] = useState("");

    const [usuarioActualId, setUsuarioActualId] = useState(null);
    const fotoUsuarioActual = localStorage.getItem('user_avatar') || null;

    const generarColorAvatar = (nombre = "Anónimo") => {
        const colores = [
            '#EF4444', '#3B82F6', '#10B981', '#F59E0B', 
            '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
        ];
        let hash = 0;
        const nombreSeguro = String(nombre || "Anónimo");
        for (let i = 0; i < nombreSeguro.length; i++) {
            hash = nombreSeguro.charCodeAt(i) + ((hash << 5) - hash);
        }
        const indice = Math.abs(hash) % colores.length;
        return colores[indice];
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(window.atob(token.split('.')[1]));
                const id = payload.id_usuario || payload.id || payload.sub;
                setUsuarioActualId(Number(id));
            } catch (e) { console.error("Error de sesión"); }
        }
        cargarForo();
    }, []);

    const cargarForo = async () => {
        try {
            const res = await api.get('/api/estudiante/foro/temas');
            setPosts(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error("Error al cargar muro"); } 
        finally { setLoading(false); }
    };

    const cargarComentarios = async (id_post) => {
        try {
            const res = await api.get(`/api/estudiante/foro/comentarios/${id_post}`);
            setComentarios(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error("Error al cargar respuestas"); }
    };

    useEffect(() => {
        if (misionSeleccionada) cargarComentarios(misionSeleccionada.id_post);
    }, [misionSeleccionada]);

    const publicarMision = async (e) => {
        e.preventDefault();
        if (!nuevaMision.titulo || !nuevaMision.contenido) return;
        const formData = new FormData();
        formData.append('titulo', nuevaMision.titulo);
        formData.append('contenido', nuevaMision.contenido);
        if (archivo) formData.append('imagen', archivo);

        try {
            await api.post('/api/estudiante/foro/crear', formData);
            setNuevaMision({ titulo: '', contenido: '' });
            setArchivo(null);
            setMostrarModal(false);
            cargarForo();
        } catch (err) { alert("Error al publicar."); }
    };

    const abrirEdicion = (post) => {
        setMisionAEditar({
            id_post: post.id_post,
            titulo: post.titulo,
            contenido: post.contenido
        });
        setArchivoEdicion(null);
        setMostrarModalEdicion(true);
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        if (!misionAEditar.titulo || !misionAEditar.contenido) return;
        
        const formData = new FormData();
        formData.append('titulo', misionAEditar.titulo);
        formData.append('contenido', misionAEditar.contenido);
        if (archivoEdicion) formData.append('imagen', archivoEdicion);

        try {
            await api.put(`/api/estudiante/foro/post/${misionAEditar.id_post}`, formData);
            setMostrarModalEdicion(false);
            cargarForo();
        } catch (err) { alert("Error al editar."); }
    };

    const eliminarMision = async (id_post) => {
        if (!window.confirm("¿Eliminar esta misión permanentemente?")) return;
        try {
            await api.delete(`/api/estudiante/foro/post/${id_post}`);
            cargarForo();
            setMisionSeleccionada(null);
        } catch (err) { alert("Error al borrar."); }
    };

    const enviarComentario = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;
        setEnviandoComentario(true);
        try {
            await api.post('/api/estudiante/foro/comentar', {
                id_post: misionSeleccionada.id_post,
                comentario: nuevoComentario
            });
            setNuevoComentario("");
            cargarComentarios(misionSeleccionada.id_post);
        } catch (err) { alert("Error al comentar."); } 
        finally { setEnviandoComentario(false); }
    };

    // 🚩 NUEVA FUNCIÓN: GUARDAR EDICIÓN DEL COMENTARIO
    const guardarEdicionComentario = async (id_comentario) => {
        if (!textoComentarioEditado.trim()) return;
        try {
            await api.put(`/api/estudiante/foro/comentario/${id_comentario}`, {
                comentario: textoComentarioEditado
            });
            setComentarioEditando(null);
            cargarComentarios(misionSeleccionada.id_post);
        } catch (err) { 
            alert("Error al editar el comentario."); 
        }
    };

    const eliminarComentario = async (id_comentario) => {
        if (!window.confirm("¿Borrar respuesta?")) return;
        try {
            await api.delete(`/api/estudiante/foro/comentario/${id_comentario}`);
            cargarComentarios(misionSeleccionada.id_post);
        } catch (err) { console.error("Error al borrar"); }
    };

    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 font-sans pb-20">
            
            <nav className="sticky top-0 z-50 bg-[#0E121C]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 shadow-2xl">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/estudiante/dashboard')}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-shinobi-gold hover:text-black transition-all border border-white/10 group"
                            title="Regresar al Panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-scholar text-white tracking-widest uppercase hidden sm:block">
                            Aldea <span className="text-shinobi-gold">Digital</span>
                        </h1>
                    </div>
                    
                    <button 
                        onClick={() => setMostrarModal(true)} 
                        className="bg-shinobi-gold text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.1em] hover:bg-white transition-all shadow-lg shadow-shinobi-gold/10 active:scale-95"
                    >
                        + Nueva Misión
                    </button>
                </div>
            </nav>

            {!misionSeleccionada ? (
                <div className="max-w-2xl mx-auto mt-8 space-y-4 px-4">
                    {loading ? (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-shinobi-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="animate-pulse text-shinobi-gold font-scholar text-xs uppercase">Sincronizando Muro...</p>
                        </div>
                    ) : posts.map((post) => {
                        const esMio = Number(post.id_usuario) === Number(usuarioActualId);
                        const mostrarAvatar = esMio && fotoUsuarioActual;

                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                key={post.id_post} 
                                className="bg-[#0E121C] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors shadow-xl relative"
                            >
                                <div className="p-4 flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold border-2 border-black/20 shadow-inner overflow-hidden"
                                            style={{ backgroundColor: !mostrarAvatar ? generarColorAvatar(post.autor) : 'transparent' }}
                                        >
                                            {mostrarAvatar ? (
                                                <img src={fotoUsuarioActual} alt={post.autor} className="w-full h-full object-cover" />
                                            ) : (
                                                post.autor?.charAt(0).toUpperCase() || "N"
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white tracking-tight">{post.autor || "Ninja Anónimo"}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium italic">{new Date(post.fecha_creacion).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {esMio && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => abrirEdicion(post)} 
                                                className="text-slate-500 hover:text-shinobi-gold p-1 transition-colors"
                                                title="Editar Pergamino"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => eliminarMision(post.id_post)} 
                                                className="text-slate-600 hover:text-red-500 p-1 transition-colors"
                                                title="Eliminar Pergamino"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="px-4 pb-4">
                                    <h3 className="text-lg font-bold text-shinobi-gold mb-2 leading-tight italic">"{post.titulo}"</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{post.contenido}</p>
                                </div>

                                {post.imagen_url && (
                                    <div className="bg-black/40 border-y border-white/5 flex justify-center overflow-hidden">
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL}${post.imagen_url}`}
                                            className="max-w-full h-auto max-h-[500px] object-contain hover:scale-[1.02] transition-transform duration-500" 
                                            alt="evidencia" 
                                        />
                                    </div>
                                )}

                                <div className="p-2 px-4 border-t border-white/5">
                                    <button 
                                        onClick={() => setMisionSeleccionada(post)}
                                        className="flex items-center justify-center gap-2 w-full text-slate-400 hover:text-shinobi-gold text-xs font-bold transition-all py-3 hover:bg-white/5 rounded-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Ver Respuestas y Colaborar
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="max-w-2xl mx-auto mt-8 px-4">
                    <button 
                        onClick={() => setMisionSeleccionada(null)} 
                        className="mb-4 text-slate-500 hover:text-white text-xs font-bold flex items-center gap-2 group transition-colors"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Muro Principal
                    </button>

                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0E121C] border border-shinobi-gold/20 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-white/5 bg-black/20 flex items-center gap-4">
                            <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                                style={{ backgroundColor: !(Number(misionSeleccionada.id_usuario) === Number(usuarioActualId) && fotoUsuarioActual) ? generarColorAvatar(misionSeleccionada.autor) : 'transparent' }}
                            >
                                {Number(misionSeleccionada.id_usuario) === Number(usuarioActualId) && fotoUsuarioActual ? (
                                    <img src={fotoUsuarioActual} alt={misionSeleccionada.autor} className="w-full h-full object-cover" />
                                ) : (
                                    misionSeleccionada.autor?.charAt(0).toUpperCase() || "N"
                                )}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{misionSeleccionada.autor || "Ninja Anónimo"}</h4>
                                <p className="text-[10px] text-slate-500 italic">Misión publicada</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <h2 className="text-3xl text-white font-bold mb-6 italic leading-tight">"{misionSeleccionada.titulo}"</h2>
                            <p className="text-slate-300 text-base leading-relaxed mb-8">{misionSeleccionada.contenido}</p>
                            {misionSeleccionada.imagen_url && (
                                <img src={`${import.meta.env.VITE_API_URL}${misionSeleccionada.imagen_url}`} className="w-full rounded-xl mb-8 border border-white/10 shadow-lg" alt="evidencia" />
                            )}
                        </div>

                        <div className="bg-black/30 p-6 space-y-6 border-t border-white/10">
                            <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black">Respuestas de la Aldea</h4>
                            
                            <div className="space-y-4">
                                {comentarios.map((c) => {
                                    const esMiComentario = Number(c.id_usuario) === Number(usuarioActualId);
                                    const mostrarAvatarComentario = esMiComentario && fotoUsuarioActual;

                                    return (
                                        <div key={c.id_comentario} className="flex gap-3">
                                            <div 
                                                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-md overflow-hidden"
                                                style={{ backgroundColor: !mostrarAvatarComentario ? generarColorAvatar(c.autor) : 'transparent' }}
                                            >
                                                {mostrarAvatarComentario ? (
                                                    <img src={fotoUsuarioActual} alt={c.autor} className="w-full h-full object-cover" />
                                                ) : (
                                                    c.autor?.charAt(0).toUpperCase() || "N"
                                                )}
                                            </div>
                                            
                                            {/* 🚩 CONTENEDOR DEL COMENTARIO CON LÓGICA DE EDICIÓN */}
                                            <div className="bg-[#1A2131] p-4 rounded-2xl rounded-tl-none flex-1 relative group">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-black text-shinobi-gold">{c.autor || "Ninja"}</span>
                                                    
                                                    {esMiComentario && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    setComentarioEditando(c.id_comentario);
                                                                    setTextoComentarioEditado(c.comentario);
                                                                }} 
                                                                className="text-slate-500 hover:text-[#3B82F6] transition-all p-1"
                                                                title="Editar respuesta"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => eliminarComentario(c.id_comentario)} 
                                                                className="text-slate-500 hover:text-red-500 transition-all p-1"
                                                                title="Eliminar respuesta"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 🚩 RENDER CONDICIONAL: Texto normal o Textarea de edición */}
                                                {comentarioEditando === c.id_comentario ? (
                                                    <div className="mt-2 flex flex-col gap-2">
                                                        <textarea
                                                            className="w-full bg-black/40 border border-[#3B82F6]/50 rounded-lg p-2 text-sm text-white outline-none focus:border-[#3B82F6] resize-none h-20"
                                                            value={textoComentarioEditado}
                                                            onChange={(e) => setTextoComentarioEditado(e.target.value)}
                                                        />
                                                        <div className="flex justify-end gap-3">
                                                            <button 
                                                                type="button"
                                                                onClick={() => setComentarioEditando(null)} 
                                                                className="text-[10px] text-slate-400 hover:text-white uppercase font-bold"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => guardarEdicionComentario(c.id_comentario)} 
                                                                className="text-[10px] bg-[#3B82F6] text-white px-4 py-1.5 rounded-md hover:bg-white hover:text-[#3B82F6] uppercase font-black transition-colors"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-300 leading-snug whitespace-pre-wrap">{c.comentario}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <form onSubmit={enviarComentario} className="flex gap-3 pt-6 border-t border-white/5">
                                <div 
                                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-lg overflow-hidden"
                                    style={{ backgroundColor: !fotoUsuarioActual ? generarColorAvatar("Tú") : 'transparent' }}
                                >
                                    {fotoUsuarioActual ? (
                                        <img src={fotoUsuarioActual} alt="Tú" className="w-full h-full object-cover" />
                                    ) : (
                                        "T"
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col gap-3">
                                    <textarea 
                                        className="w-full bg-[#1A2131] border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-shinobi-gold/50 transition-all resize-none h-24 shadow-inner"
                                        placeholder="Escribe una respuesta técnica..."
                                        value={nuevoComentario}
                                        onChange={(e) => setNuevoComentario(e.target.value)}
                                    />
                                    <button 
                                        disabled={enviandoComentario}
                                        className="self-end bg-shinobi-gold text-black px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-shinobi-gold/5"
                                    >
                                        {enviandoComentario ? 'Enviando...' : 'Publicar Respuesta'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}

            <AnimatePresence>
                {/* MODAL DE CREACIÓN ORIGINAL */}
                {mostrarModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMostrarModal(false)} className="absolute inset-0" />
                        <motion.form 
                            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            onSubmit={publicarMision}
                            className="bg-[#0E121C] border border-shinobi-gold/30 rounded-[2.5rem] p-8 max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(197,160,89,0.1)]"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-white font-scholar text-2xl tracking-tighter uppercase italic">Nueva Misión de <span className="text-shinobi-gold">Ayuda</span></h2>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">El conocimiento es el arma más fuerte</p>
                            </div>
                            
                            <div className="space-y-5">
                                <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-shinobi-gold transition-all" placeholder="Título de la duda..." value={nuevaMision.titulo} onChange={(e) => setNuevaMision({...nuevaMision, titulo: e.target.value})} />
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none h-36 resize-none focus:border-shinobi-gold transition-all" placeholder="Describe el problema matemático detalladamente..." value={nuevaMision.contenido} onChange={(e) => setNuevaMision({...nuevaMision, contenido: e.target.value})} />
                                
                                <div className="flex flex-col gap-4">
                                    <label htmlFor="file-upload" className="w-full cursor-pointer bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 text-center text-[10px] text-slate-400 hover:border-shinobi-gold hover:text-shinobi-gold transition-all">
                                        {archivo ? `✅ ${archivo.name}` : "📸 ADJUNTAR EVIDENCIA VISUAL"}
                                        <input id="file-upload" type="file" className="hidden" onChange={(e) => setArchivo(e.target.files[0])} />
                                    </label>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-bold text-[10px] uppercase transition-all hover:bg-slate-700">Cancelar</button>
                                        <button type="submit" className="flex-2 bg-shinobi-gold text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-shinobi-gold/10 hover:bg-white transition-all">Publicar Pergamino</button>
                                    </div>
                                </div>
                            </div>
                        </motion.form>
                    </div>
                )}

                {/* MODAL DE EDICIÓN */}
                {mostrarModalEdicion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMostrarModalEdicion(false)} className="absolute inset-0" />
                        <motion.form 
                            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            onSubmit={guardarEdicion}
                            className="bg-[#0E121C] border border-[#3B82F6]/30 rounded-[2.5rem] p-8 max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(59,130,246,0.1)]"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-white font-scholar text-2xl tracking-tighter uppercase italic">Reescribir <span className="text-[#3B82F6]">Pergamino</span></h2>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Mejora tu solicitud de ayuda</p>
                            </div>
                            
                            <div className="space-y-5">
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#3B82F6] transition-all" 
                                    placeholder="Título de la duda..." 
                                    value={misionAEditar.titulo} 
                                    onChange={(e) => setMisionAEditar({...misionAEditar, titulo: e.target.value})} 
                                />
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none h-36 resize-none focus:border-[#3B82F6] transition-all" 
                                    placeholder="Describe el problema matemático detalladamente..." 
                                    value={misionAEditar.contenido} 
                                    onChange={(e) => setMisionAEditar({...misionAEditar, contenido: e.target.value})} 
                                />
                                
                                <div className="flex flex-col gap-4">
                                    <label htmlFor="file-upload-edit" className="w-full cursor-pointer bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 text-center text-[10px] text-slate-400 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all">
                                        {archivoEdicion ? `✅ ${archivoEdicion.name}` : "📸 ACTUALIZAR EVIDENCIA (OPCIONAL)"}
                                        <input id="file-upload-edit" type="file" className="hidden" onChange={(e) => setArchivoEdicion(e.target.files[0])} />
                                    </label>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setMostrarModalEdicion(false)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-bold text-[10px] uppercase transition-all hover:bg-slate-700">Cancelar</button>
                                        <button type="submit" className="flex-2 bg-[#3B82F6] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-[#3B82F6]/10 hover:bg-white hover:text-[#3B82F6] transition-all">Guardar Cambios</button>
                                    </div>
                                </div>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ForoComunidad;