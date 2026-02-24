// =============================================
// DATOS SIMULADOS DE SOCIOS
// =============================================

const hoy = new Date()
const formatDate = (d) => d.toISOString().split('T')[0]

const haceDias = (dias) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() - dias)
    return formatDate(d)
}
const enDias = (dias) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() + dias)
    return formatDate(d)
}

let socios = [
    { id: 1, nombre: 'Carlos Martinez Lopez', genero: 'M', correo: 'carlos@email.com', telefono: '555-1234', membresia: 'mensual', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(180), contratoFin: enDias(185), fechaRegistro: haceDias(180), bioRostro: true, bioHuella: true },
    { id: 2, nombre: 'Maria Garcia Ruiz', genero: 'F', correo: 'maria@email.com', telefono: '555-5678', membresia: 'anual', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(300), contratoFin: enDias(5), fechaRegistro: haceDias(300), bioRostro: true, bioHuella: false },
    { id: 3, nombre: 'Juan Hernandez Diaz', genero: 'M', correo: 'juan@email.com', telefono: '555-9012', membresia: 'mensual', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(400), contratoFin: haceDias(10), fechaRegistro: haceDias(400), bioRostro: false, bioHuella: false },
    { id: 4, nombre: 'Ana Lopez Perez', genero: 'F', correo: 'ana@email.com', telefono: '555-3456', membresia: 'trimestral', estadoSocio: 'activo', firmoContrato: false, contratoInicio: null, contratoFin: null, fechaRegistro: haceDias(60), bioRostro: true, bioHuella: true },
    { id: 5, nombre: 'Roberto Sanchez', genero: 'M', correo: 'roberto@email.com', telefono: '555-7890', membresia: 'mensual', estadoSocio: 'inactivo', firmoContrato: true, contratoInicio: haceDias(500), contratoFin: haceDias(135), fechaRegistro: haceDias(500), bioRostro: false, bioHuella: false },
    { id: 6, nombre: 'Laura Torres Vega', genero: 'F', correo: 'laura@email.com', telefono: '555-1122', membresia: 'anual', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(90), contratoFin: enDias(275), fechaRegistro: haceDias(90), bioRostro: true, bioHuella: true },
    { id: 7, nombre: 'Diego Ramirez Cruz', genero: 'M', correo: 'diego@email.com', telefono: '555-3344', membresia: 'trimestral', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(350), contratoFin: enDias(12), fechaRegistro: haceDias(350), bioRostro: true, bioHuella: false },
    { id: 8, nombre: 'Sofia Flores Mendoza', genero: 'F', correo: 'sofia@email.com', telefono: '555-5566', membresia: 'mensual', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(20), contratoFin: enDias(345), fechaRegistro: haceDias(20), bioRostro: false, bioHuella: true },
    { id: 9, nombre: 'Miguel Reyes', genero: 'M', correo: 'miguel@email.com', telefono: '555-7788', membresia: '', estadoSocio: 'inactivo', firmoContrato: false, contratoInicio: null, contratoFin: null, fechaRegistro: haceDias(150), bioRostro: false, bioHuella: false },
    { id: 10, nombre: 'Valentina Morales Silva', genero: 'F', correo: 'valentina@email.com', telefono: '555-9900', membresia: 'trimestral', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(100), contratoFin: enDias(2), fechaRegistro: haceDias(100), bioRostro: true, bioHuella: true },
    { id: 11, nombre: 'Fernando Castro Rios', genero: 'M', correo: 'fernando@email.com', telefono: '555-2233', membresia: 'anual', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(60), contratoFin: enDias(305), fechaRegistro: haceDias(15), bioRostro: true, bioHuella: true },
    { id: 12, nombre: 'Alex Rivera', genero: 'O', correo: 'alex@email.com', telefono: '555-4455', membresia: 'semanal', estadoSocio: 'activo', firmoContrato: true, contratoInicio: haceDias(365), contratoFin: haceDias(1), fechaRegistro: haceDias(365), bioRostro: false, bioHuella: false },
]

// =============================================
// UTILIDADES
// =============================================

const ITEMS_POR_PAGINA = 8
let paginaActual = 1
let socioEditando = null
let capturaRostro = false
let capturaHuella = false

const estadoContrato = (socio) => {
    if (!socio.firmoContrato) return 'sin_contrato'
    if (!socio.contratoFin) return 'sin_contrato'
    const fin = new Date(socio.contratoFin)
    const diffDias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24))
    if (diffDias < 0) return 'vencido'
    if (diffDias <= 15) return 'por_vencer'
    return 'activo'
}

const diasRestantes = (socio) => {
    if (!socio.contratoFin) return null
    const fin = new Date(socio.contratoFin)
    return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24))
}

const badgeContrato = (socio) => {
    const estado = estadoContrato(socio)
    const dias = diasRestantes(socio)
    switch (estado) {
        case 'activo': return '<span class="badge badge-activo"><i data-lucide="check-circle" class="w-3 h-3"></i> Activo</span>'
        case 'por_vencer': return `<span class="badge badge-por-vencer"><i data-lucide="alert-triangle" class="w-3 h-3"></i> ${dias}d</span>`
        case 'vencido': return `<span class="badge badge-vencido"><i data-lucide="x-circle" class="w-3 h-3"></i> -${Math.abs(dias)}d</span>`
        default: return '<span class="badge badge-sin-contrato">Sin contrato</span>'
    }
}

const badgeEstadoSocio = (estado) => {
    return estado === 'activo'
        ? '<span class="badge badge-activo">Activo</span>'
        : '<span class="badge badge-inactivo">Inactivo</span>'
}

const badgeBiometrico = (socio) => {
    const rostro = socio.bioRostro
    const huella = socio.bioHuella
    let html = '<div class="flex flex-col gap-0.5">'
    html += rostro
        ? '<span class="badge-bio badge-bio-ok"><i data-lucide="scan-face" class="w-3 h-3"></i> Rostro</span>'
        : '<span class="badge-bio badge-bio-pending"><i data-lucide="scan-face" class="w-3 h-3"></i> Rostro</span>'
    html += huella
        ? '<span class="badge-bio badge-bio-ok"><i data-lucide="fingerprint" class="w-3 h-3"></i> Huella</span>'
        : '<span class="badge-bio badge-bio-pending"><i data-lucide="fingerprint" class="w-3 h-3"></i> Huella</span>'
    html += '</div>'
    return html
}

const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha + 'T00:00:00')
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const membresiaLabel = (m) => {
    const map = { diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', trimestral: 'Trimestral', anual: 'Anual' }
    return map[m] || 'Sin membresia'
}

const generoLabel = (g) => {
    if (g === 'M') return 'Masculino'
    if (g === 'F') return 'Femenino'
    if (g === 'O') return 'Otro'
    return '-'
}

const generoAvatar = (g) => {
    if (g === 'M') return 'avatar-m'
    if (g === 'F') return 'avatar-f'
    return 'avatar-o'
}

// =============================================
// FECHA/HORA HEADER
// =============================================
const fechaHoraEl = document.getElementById('fecha-hora-header')
const actualizarFechaHora = () => {
    const now = new Date()
    const fecha = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    if (fechaHoraEl) fechaHoraEl.textContent = `Admin. | ${fecha} | ${hora}`
}
actualizarFechaHora()
setInterval(actualizarFechaHora, 60000)

// =============================================
// SIDEBAR MOBILE
// =============================================
const menuToggle = document.getElementById('menu-toggle')
const sidebar = document.querySelector('.sidebar')
const backdrop = document.getElementById('backdrop')

if (menuToggle && sidebar && backdrop) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full')
        backdrop.classList.toggle('hidden')
    })
    backdrop.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full')
        backdrop.classList.add('hidden')
    })
}

// =============================================
// FILTROS
// =============================================
const inputBusqueda = document.getElementById('busqueda-socios')
const filtroEstado = document.getElementById('filtro-estado')
const filtroContrato = document.getElementById('filtro-contrato')
const filtroGenero = document.getElementById('filtro-genero')
const filtroFechaDesde = document.getElementById('filtro-fecha-desde')
const filtroFechaHasta = document.getElementById('filtro-fecha-hasta')

const obtenerSociosFiltrados = () => {
    let resultado = [...socios]
    const busqueda = (inputBusqueda?.value || '').toLowerCase().trim()
    if (busqueda) {
        resultado = resultado.filter(s =>
            s.nombre.toLowerCase().includes(busqueda) ||
            s.correo.toLowerCase().includes(busqueda) ||
            String(s.id).includes(busqueda)
        )
    }
    const estado = filtroEstado?.value || 'todos'
    if (estado !== 'todos') resultado = resultado.filter(s => s.estadoSocio === estado)
    const contrato = filtroContrato?.value || 'todos'
    if (contrato !== 'todos') resultado = resultado.filter(s => estadoContrato(s) === contrato)
    const genero = filtroGenero?.value || 'todos'
    if (genero !== 'todos') resultado = resultado.filter(s => s.genero === genero)
    const desde = filtroFechaDesde?.value
    const hasta = filtroFechaHasta?.value
    if (desde) resultado = resultado.filter(s => s.fechaRegistro >= desde)
    if (hasta) resultado = resultado.filter(s => s.fechaRegistro <= hasta)
    return resultado
}

const aplicarFiltros = () => {
    paginaActual = 1
    renderTabla()
    renderKPIs()
}

;[inputBusqueda, filtroEstado, filtroContrato, filtroGenero, filtroFechaDesde, filtroFechaHasta].forEach(el => {
    if (el) el.addEventListener(el.tagName === 'INPUT' && el.type === 'text' ? 'input' : 'change', aplicarFiltros)
})

// =============================================
// RENDER TABLA
// =============================================
const tablaBody = document.getElementById('tabla-socios-body')

const renderTabla = () => {
    const filtrados = obtenerSociosFiltrados()
    const totalPaginas = Math.ceil(filtrados.length / ITEMS_POR_PAGINA)
    if (paginaActual > totalPaginas) paginaActual = totalPaginas || 1
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA
    const paginados = filtrados.slice(inicio, inicio + ITEMS_POR_PAGINA)
    if (!tablaBody) return

    if (paginados.length === 0) {
        tablaBody.innerHTML = `
            <tr><td colspan="9" class="px-4 py-12 text-center text-gray-500 text-sm">
                <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                <p>No se encontraron socios con estos filtros.</p>
            </td></tr>`
        lucide.createIcons()
        renderPaginacion(filtrados.length, totalPaginas)
        return
    }

    tablaBody.innerHTML = paginados.map(s => {
        const iniciales = s.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        let vigenciaHTML = '-'
        if (s.firmoContrato && s.contratoInicio && s.contratoFin) {
            vigenciaHTML = `<span class="text-xs text-gray-400">${formatFecha(s.contratoInicio)}</span><br><span class="text-xs text-gray-500">${formatFecha(s.contratoFin)}</span>`
        }
        return `
        <tr class="group">
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="avatar-placeholder ${generoAvatar(s.genero)}">${iniciales}</div>
                    <div>
                        <p class="text-sm font-medium">${s.nombre}</p>
                        <p class="text-xs text-gray-500">${s.correo}</p>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-400">${generoLabel(s.genero)}</td>
            <td class="px-4 py-3 text-sm text-gray-400">${s.telefono}</td>
            <td class="px-4 py-3 text-sm">${membresiaLabel(s.membresia)}</td>
            <td class="px-4 py-3 text-center">${badgeContrato(s)}</td>
            <td class="px-4 py-3 text-center">${vigenciaHTML}</td>
            <td class="px-4 py-3 text-center">${badgeBiometrico(s)}</td>
            <td class="px-4 py-3 text-center">${badgeEstadoSocio(s.estadoSocio)}</td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition">
                    <button class="btn-accion btn-ver" onclick="verDetalle(${s.id})" title="Ver detalle"><i data-lucide="eye" class="w-4 h-4"></i></button>
                    <button class="btn-accion btn-editar" onclick="editarSocio(${s.id})" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarSocio(${s.id})" title="Eliminar"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>`
    }).join('')

    lucide.createIcons()
    renderPaginacion(filtrados.length, totalPaginas)
}

// =============================================
// PAGINACION
// =============================================
const renderPaginacion = (totalItems, totalPaginas) => {
    const infoEl = document.getElementById('paginacion-info')
    const btnsEl = document.getElementById('paginacion-btns')
    if (!infoEl || !btnsEl) return
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA + 1
    const fin = Math.min(paginaActual * ITEMS_POR_PAGINA, totalItems)
    infoEl.textContent = totalItems > 0 ? `${inicio}-${fin} de ${totalItems} socios` : '0 socios'
    let html = ''
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<button class="pag-btn ${i === paginaActual ? 'activo' : ''}" onclick="irAPagina(${i})">${i}</button>`
    }
    btnsEl.innerHTML = html
}

window.irAPagina = (p) => { paginaActual = p; renderTabla() }

// =============================================
// KPIs
// =============================================
const renderKPIs = () => {
    const total = socios.length
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    const nuevosEsteMes = socios.filter(s => new Date(s.fechaRegistro) >= inicioMes).length
    const nuevosMesAnterior = socios.filter(s => {
        const f = new Date(s.fechaRegistro)
        return f >= inicioMesAnterior && f <= finMesAnterior
    }).length
    const contratosActivos = socios.filter(s => estadoContrato(s) === 'activo').length
    const porVencer = socios.filter(s => estadoContrato(s) === 'por_vencer').length
    const vencidos = socios.filter(s => estadoContrato(s) === 'vencido').length

    const elTotal = document.getElementById('kpi-total')
    const elNuevos = document.getElementById('kpi-nuevos')
    const elNuevosTrend = document.getElementById('kpi-nuevos-trend')
    const elContratosActivos = document.getElementById('kpi-contratos-activos')
    const elPorVencer = document.getElementById('kpi-por-vencer')
    const elVencidos = document.getElementById('kpi-vencidos')

    if (elTotal) elTotal.textContent = total
    if (elNuevos) elNuevos.textContent = nuevosEsteMes
    if (elContratosActivos) elContratosActivos.textContent = contratosActivos
    if (elPorVencer) elPorVencer.textContent = porVencer
    if (elVencidos) elVencidos.textContent = vencidos

    if (elNuevosTrend) {
        if (nuevosMesAnterior === 0 && nuevosEsteMes > 0) {
            elNuevosTrend.innerHTML = '<span class="text-green-400">Nuevos</span>'
        } else if (nuevosMesAnterior === 0) {
            elNuevosTrend.innerHTML = '<span class="text-gray-500">-</span>'
        } else {
            const pct = ((nuevosEsteMes - nuevosMesAnterior) / nuevosMesAnterior * 100).toFixed(0)
            const color = pct > 0 ? 'text-green-400' : pct < 0 ? 'text-red-400' : 'text-gray-400'
            elNuevosTrend.innerHTML = `<span class="${color}">${pct > 0 ? '+' : ''}${pct}%</span>`
        }
    }
}

// =============================================
// ALERTAS DE CONTRATOS
// =============================================
const renderAlertas = () => {
    const container = document.getElementById('alertas-contratos')
    if (!container) return
    const vencidos = socios.filter(s => estadoContrato(s) === 'vencido')
    const porVencer = socios.filter(s => estadoContrato(s) === 'por_vencer')
    if (vencidos.length === 0 && porVencer.length === 0) { container.innerHTML = ''; return }
    let html = ''
    if (vencidos.length > 0) {
        html += `<div class="alerta-contrato alerta-vencido">
            <i data-lucide="alert-octagon" class="w-4 h-4 flex-shrink-0" style="color: #ef4444;"></i>
            <span><strong>${vencidos.length} contrato${vencidos.length > 1 ? 's' : ''} vencido${vencidos.length > 1 ? 's' : ''}:</strong> ${vencidos.map(s => s.nombre).join(', ')} &mdash; Requieren renovacion.</span>
        </div>`
    }
    if (porVencer.length > 0) {
        html += `<div class="alerta-contrato alerta-por-vencer">
            <i data-lucide="alert-triangle" class="w-4 h-4 flex-shrink-0" style="color: #eab308;"></i>
            <span><strong>${porVencer.length} contrato${porVencer.length > 1 ? 's' : ''} por vencer:</strong> ${porVencer.map(s => `${s.nombre} (${diasRestantes(s)}d)`).join(', ')}</span>
        </div>`
    }
    container.innerHTML = html
    lucide.createIcons()
}

// =============================================
// MODAL REGISTRO / EDICION
// =============================================
const modal = document.getElementById('modal-socio')
const form = document.getElementById('form-socio')
const modalTitulo = document.getElementById('modal-titulo')
const btnAgregar = document.getElementById('btn-agregar-socio')
const btnCerrar = document.getElementById('btn-cerrar-modal')
const btnCancelar = document.getElementById('btn-cancelar')
const toggleContrato = document.getElementById('firmo-contrato')
const camposContrato = document.getElementById('campos-contrato')

const resetBiometrico = () => {
    capturaRostro = false
    capturaHuella = false
    const btnRostro = document.getElementById('btn-captura-rostro')
    const btnHuella = document.getElementById('btn-captura-huella')
    const estadoR = document.getElementById('estado-rostro')
    const estadoH = document.getElementById('estado-huella')
    if (btnRostro) { btnRostro.classList.remove('captured') }
    if (btnHuella) { btnHuella.classList.remove('captured') }
    if (estadoR) estadoR.textContent = 'Sin captura'
    if (estadoH) estadoH.textContent = 'Sin captura'
}

const abrirModal = (socio = null) => {
    socioEditando = socio
    form.reset()
    resetBiometrico()

    if (socio) {
        modalTitulo.innerHTML = '<i data-lucide="pencil" class="w-6 h-6" style="color: var(--color-rojo-principal);"></i><span>Editar Socio</span>'
        document.getElementById('nombre-socio').value = socio.nombre
        document.getElementById('correo-socio').value = socio.correo
        document.getElementById('telefono-socio').value = socio.telefono
        document.getElementById('membresia').value = socio.membresia || ''

        // Radio genero
        const radios = document.querySelectorAll('input[name="genero"]')
        radios.forEach(r => { r.checked = r.value === socio.genero })

        // Contrato toggle
        toggleContrato.checked = socio.firmoContrato
        if (socio.firmoContrato) {
            camposContrato.classList.remove('opacity-40', 'pointer-events-none')
            document.getElementById('contrato-inicio').value = socio.contratoInicio || ''
            document.getElementById('contrato-fin').value = socio.contratoFin || ''
        } else {
            camposContrato.classList.add('opacity-40', 'pointer-events-none')
        }

        // Biometrico
        if (socio.bioRostro) {
            capturaRostro = true
            document.getElementById('btn-captura-rostro')?.classList.add('captured')
            const er = document.getElementById('estado-rostro')
            if (er) er.textContent = 'Capturado'
        }
        if (socio.bioHuella) {
            capturaHuella = true
            document.getElementById('btn-captura-huella')?.classList.add('captured')
            const eh = document.getElementById('estado-huella')
            if (eh) eh.textContent = 'Capturado'
        }
    } else {
        modalTitulo.innerHTML = '<i data-lucide="user-plus" class="w-6 h-6" style="color: var(--color-rojo-principal);"></i><span>Registro de Nuevo Socio</span>'
        camposContrato.classList.add('opacity-40', 'pointer-events-none')
        toggleContrato.checked = false
    }

    modal.classList.remove('hidden')
    lucide.createIcons()
}

const cerrarModal = () => {
    modal.classList.add('hidden')
    socioEditando = null
    form.reset()
    resetBiometrico()
}

// Toggle contrato
toggleContrato?.addEventListener('change', () => {
    if (toggleContrato.checked) {
        camposContrato.classList.remove('opacity-40', 'pointer-events-none')
    } else {
        camposContrato.classList.add('opacity-40', 'pointer-events-none')
    }
})

btnAgregar?.addEventListener('click', () => abrirModal())
btnCerrar?.addEventListener('click', cerrarModal)
btnCancelar?.addEventListener('click', cerrarModal)
modal?.addEventListener('click', (e) => { if (e.target === modal) cerrarModal() })

// Submit form
form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const generoRadio = document.querySelector('input[name="genero"]:checked')
    const datos = {
        nombre: document.getElementById('nombre-socio').value.trim(),
        genero: generoRadio ? generoRadio.value : '',
        correo: document.getElementById('correo-socio').value.trim(),
        telefono: document.getElementById('telefono-socio').value.trim(),
        membresia: document.getElementById('membresia').value,
        firmoContrato: toggleContrato.checked,
        contratoInicio: toggleContrato.checked ? document.getElementById('contrato-inicio')?.value || null : null,
        contratoFin: toggleContrato.checked ? document.getElementById('contrato-fin')?.value || null : null,
        estadoSocio: 'activo',
        fechaRegistro: formatDate(hoy),
        bioRostro: capturaRostro,
        bioHuella: capturaHuella,
    }

    if (socioEditando) {
        const idx = socios.findIndex(s => s.id === socioEditando.id)
        if (idx !== -1) socios[idx] = { ...socios[idx], ...datos }
        Swal.fire({ icon: 'success', title: 'Socio actualizado', text: `${datos.nombre} ha sido actualizado.`, background: '#1a1a1f', color: '#E0E0E0', confirmButtonColor: '#FF3B3B', timer: 2000, showConfirmButton: false })
    } else {
        datos.id = socios.length > 0 ? Math.max(...socios.map(s => s.id)) + 1 : 1
        socios.push(datos)
        Swal.fire({ icon: 'success', title: 'Socio registrado', text: `${datos.nombre} ha sido dado de alta.`, background: '#1a1a1f', color: '#E0E0E0', confirmButtonColor: '#FF3B3B', timer: 2000, showConfirmButton: false })
    }

    cerrarModal()
    renderTabla()
    renderKPIs()
    renderAlertas()
})

// =============================================
// CAPTURA FACIAL
// =============================================
const modalFacial = document.getElementById('modal-captura-facial')
const btnCapturaRostro = document.getElementById('btn-captura-rostro')
const btnCerrarFacial = document.getElementById('btn-cerrar-facial')
const btnCancelarCaptura = document.getElementById('btn-cancelar-captura')
const btnConfirmarCaptura = document.getElementById('btn-confirmar-captura')
let videoStream = null

const abrirCapturaFacial = async () => {
    modalFacial?.classList.remove('hidden')
    lucide.createIcons()
    try {
        const video = document.getElementById('video-captura-facial')
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
        if (video) video.srcObject = videoStream
        // Simular deteccion despues de 2s
        setTimeout(() => {
            const msg = document.getElementById('mensaje-deteccion')
            if (msg) msg.textContent = 'Rostro detectado correctamente'
            if (btnConfirmarCaptura) {
                btnConfirmarCaptura.disabled = false
                btnConfirmarCaptura.classList.remove('opacity-50', 'cursor-not-allowed')
            }
        }, 2000)
    } catch (err) {
        const msg = document.getElementById('mensaje-deteccion')
        if (msg) msg.textContent = 'Camara no disponible - modo simulacion'
        setTimeout(() => {
            if (btnConfirmarCaptura) {
                btnConfirmarCaptura.disabled = false
                btnConfirmarCaptura.classList.remove('opacity-50', 'cursor-not-allowed')
            }
        }, 1500)
    }
}

const cerrarCapturaFacial = () => {
    if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop())
        videoStream = null
    }
    modalFacial?.classList.add('hidden')
    if (btnConfirmarCaptura) {
        btnConfirmarCaptura.disabled = true
        btnConfirmarCaptura.classList.add('opacity-50', 'cursor-not-allowed')
    }
}

btnCapturaRostro?.addEventListener('click', abrirCapturaFacial)
btnCerrarFacial?.addEventListener('click', cerrarCapturaFacial)
btnCancelarCaptura?.addEventListener('click', cerrarCapturaFacial)

btnConfirmarCaptura?.addEventListener('click', () => {
    capturaRostro = true
    const btn = document.getElementById('btn-captura-rostro')
    const estado = document.getElementById('estado-rostro')
    if (btn) btn.classList.add('captured')
    if (estado) estado.textContent = 'Capturado'
    cerrarCapturaFacial()
    lucide.createIcons()
})

// =============================================
// CAPTURA HUELLA
// =============================================
const modalHuella = document.getElementById('modal-captura-huella')
const btnCapturaHuella = document.getElementById('btn-captura-huella')
const btnCerrarHuella = document.getElementById('btn-cerrar-huella')
const btnCancelarHuella = document.getElementById('btn-cancelar-huella')
const btnSimularHuella = document.getElementById('btn-simular-huella')

btnCapturaHuella?.addEventListener('click', () => {
    modalHuella?.classList.remove('hidden')
    lucide.createIcons()
})

const cerrarCapturaHuella = () => { modalHuella?.classList.add('hidden') }

btnCerrarHuella?.addEventListener('click', cerrarCapturaHuella)
btnCancelarHuella?.addEventListener('click', cerrarCapturaHuella)

btnSimularHuella?.addEventListener('click', () => {
    const estado = document.getElementById('huella-estado')
    const progreso = document.getElementById('huella-progreso')
    const scanner = document.querySelector('.fingerprint-scanner')

    if (estado) estado.textContent = 'Capturando huella...'
    if (progreso) progreso.textContent = 'Manten el dedo firme...'

    setTimeout(() => {
        capturaHuella = true
        if (scanner) scanner.classList.add('success')
        if (estado) { estado.textContent = 'Huella capturada exitosamente'; estado.style.color = '#22c55e' }
        if (progreso) { progreso.textContent = 'Puedes cerrar esta ventana'; progreso.style.color = '#22c55e' }

        const btn = document.getElementById('btn-captura-huella')
        const estadoH = document.getElementById('estado-huella')
        if (btn) btn.classList.add('captured')
        if (estadoH) estadoH.textContent = 'Capturado'

        setTimeout(() => {
            cerrarCapturaHuella()
            if (scanner) scanner.classList.remove('success')
            if (estado) { estado.textContent = 'Coloca tu dedo en el lector'; estado.style.color = '' }
            if (progreso) { progreso.textContent = 'Esperando lector biometrico...'; progreso.style.color = '' }
            lucide.createIcons()
        }, 1200)
    }, 2000)
})

// =============================================
// VER DETALLE
// =============================================
const modalDetalle = document.getElementById('modal-detalle')
const detalleContenido = document.getElementById('detalle-contenido')
const btnCerrarDetalle = document.getElementById('btn-cerrar-detalle')

window.verDetalle = (id) => {
    const s = socios.find(x => x.id === id)
    if (!s) return
    const dias = diasRestantes(s)
    let contratoInfo = 'No firmo contrato'
    if (s.firmoContrato) contratoInfo = `${formatFecha(s.contratoInicio)} - ${formatFecha(s.contratoFin)}`
    const iniciales = s.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

    detalleContenido.innerHTML = `
        <div class="flex items-center gap-4 mb-4 pb-4 border-b border-gray-800/50">
            <div class="avatar-placeholder ${generoAvatar(s.genero)}" style="width:48px;height:48px;font-size:1rem;">${iniciales}</div>
            <div>
                <p class="text-lg font-semibold">${s.nombre}</p>
                <p class="text-sm text-gray-500">${s.correo}</p>
            </div>
        </div>
        <div class="detalle-item"><span class="detalle-label">ID</span><span class="detalle-valor">#${s.id}</span></div>
        <div class="detalle-item"><span class="detalle-label">Genero</span><span class="detalle-valor">${generoLabel(s.genero)}</span></div>
        <div class="detalle-item"><span class="detalle-label">Telefono</span><span class="detalle-valor">${s.telefono || '-'}</span></div>
        <div class="detalle-item"><span class="detalle-label">Membresia</span><span class="detalle-valor">${membresiaLabel(s.membresia)}</span></div>
        <div class="detalle-item"><span class="detalle-label">Estado Socio</span><span class="detalle-valor">${badgeEstadoSocio(s.estadoSocio)}</span></div>
        <div class="detalle-item"><span class="detalle-label">Firmo Contrato</span><span class="detalle-valor">${s.firmoContrato ? 'Si' : 'No'}</span></div>
        <div class="detalle-item"><span class="detalle-label">Vigencia</span><span class="detalle-valor">${contratoInfo}</span></div>
        <div class="detalle-item"><span class="detalle-label">Estado Contrato</span><span class="detalle-valor">${badgeContrato(s)}</span></div>
        ${s.firmoContrato && dias !== null ? `<div class="detalle-item"><span class="detalle-label">Dias Restantes</span><span class="detalle-valor ${dias < 0 ? 'text-red-400' : dias <= 15 ? 'text-yellow-400' : 'text-green-400'}">${dias} dias</span></div>` : ''}
        <div class="detalle-item"><span class="detalle-label">Biometrico</span><span class="detalle-valor">${badgeBiometrico(s)}</span></div>
        <div class="detalle-item"><span class="detalle-label">Fecha Registro</span><span class="detalle-valor">${formatFecha(s.fechaRegistro)}</span></div>
    `

    modalDetalle.classList.remove('hidden')
    lucide.createIcons()
}

btnCerrarDetalle?.addEventListener('click', () => modalDetalle.classList.add('hidden'))
modalDetalle?.addEventListener('click', (e) => { if (e.target === modalDetalle) modalDetalle.classList.add('hidden') })

// =============================================
// EDITAR / ELIMINAR
// =============================================
window.editarSocio = (id) => {
    const s = socios.find(x => x.id === id)
    if (s) abrirModal(s)
}

window.eliminarSocio = (id) => {
    const s = socios.find(x => x.id === id)
    if (!s) return
    Swal.fire({
        title: 'Eliminar socio',
        text: `Se eliminara a ${s.nombre}. Esta accion no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4b5563',
        background: '#1a1a1f',
        color: '#E0E0E0',
    }).then((result) => {
        if (result.isConfirmed) {
            socios = socios.filter(x => x.id !== id)
            renderTabla()
            renderKPIs()
            renderAlertas()
            Swal.fire({ icon: 'success', title: 'Eliminado', text: `${s.nombre} fue eliminado.`, background: '#1a1a1f', color: '#E0E0E0', confirmButtonColor: '#FF3B3B', timer: 1500, showConfirmButton: false })
        }
    })
}

// =============================================
// INIT
// =============================================
renderTabla()
renderKPIs()
renderAlertas()
