(function () {
    "use strict";

    var CLAVE_CARRITO = "carritoRouterForge";
    var CLAVE_PEDIDOS = "pedidosRouterForge";
    var CLAVE_SOLICITUDES = "solicitudesFirmware";

    function leer(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave)) || [];
        } catch (error) {
            return [];
        }
    }

    function guardar(clave, valor) {
        localStorage.setItem(clave, JSON.stringify(valor));
    }

    function escapar(texto) {
        var div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    function dinero(valor) {
        return "$" + Number(valor).toFixed(2);
    }

    function fechaCorta(iso) {
        var fecha = new Date(iso);
        return fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function totalUnidades(carrito) {
        return carrito.reduce(function (suma, item) {
            return suma + item.cantidad;
        }, 0);
    }

    function totalDinero(carrito) {
        return carrito.reduce(function (suma, item) {
            return suma + item.precio * item.cantidad;
        }, 0);
    }

    function actualizarContadores() {
        var total = totalUnidades(leer(CLAVE_CARRITO));
        document.querySelectorAll(".carrito-contador").forEach(function (elemento) {
            elemento.textContent = total;
        });
    }

    function agregarAlCarrito(id, nombre, precio) {
        var carrito = leer(CLAVE_CARRITO);
        var existente = carrito.find(function (item) {
            return item.id === id;
        });

        if (existente) {
            existente.cantidad += 1;
        } else {
            carrito.push({ id: id, nombre: nombre, precio: Number(precio), cantidad: 1 });
        }

        guardar(CLAVE_CARRITO, carrito);
        actualizarContadores();
    }

    function mostrarToast(mensaje) {
        if (!window.bootstrap) {
            return;
        }

        var contenedor = document.getElementById("toast-container");

        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.id = "toast-container";
            contenedor.className = "toast-container position-fixed bottom-0 end-0 p-3";
            document.body.appendChild(contenedor);
        }

        var elemento = document.createElement("div");
        elemento.className = "toast align-items-center text-bg-success border-0";
        elemento.setAttribute("role", "alert");
        elemento.setAttribute("aria-live", "assertive");
        elemento.setAttribute("aria-atomic", "true");
        elemento.innerHTML =
            '<div class="d-flex">' +
                '<div class="toast-body">' + mensaje + '</div>' +
                '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>' +
            '</div>';

        contenedor.appendChild(elemento);

        var toast = window.bootstrap.Toast.getOrCreateInstance(elemento, { delay: 2200 });
        toast.show();

        elemento.addEventListener("hidden.bs.toast", function () {
            elemento.remove();
        });
    }

    function crearPanelCarrito() {
        if (document.getElementById("carritoPanel")) {
            return;
        }

        var contenedor = document.createElement("div");
        contenedor.innerHTML =
            '<div class="offcanvas offcanvas-end" tabindex="-1" id="carritoPanel" aria-labelledby="carritoPanelLabel">' +
                '<div class="offcanvas-header">' +
                    '<h2 class="offcanvas-title h5" id="carritoPanelLabel">Tu carrito</h2>' +
                    '<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>' +
                '</div>' +
                '<div class="offcanvas-body">' +
                    '<div id="carrito-panel-lista"></div>' +
                    '<div class="d-flex justify-content-between border-top pt-3 mt-3">' +
                        '<strong>Total:</strong>' +
                        '<span class="precio" id="carrito-panel-total">$0.00</span>' +
                    '</div>' +
                    '<a href="carrito.html" class="btn btn-success w-100 mt-3">Ver carrito y pagar</a>' +
                '</div>' +
            '</div>';

        document.body.appendChild(contenedor.firstElementChild);
    }

    function dibujarPanelCarrito() {
        var lista = document.getElementById("carrito-panel-lista");

        if (!lista) {
            return;
        }

        var carrito = leer(CLAVE_CARRITO);
        var total = document.getElementById("carrito-panel-total");
        lista.innerHTML = "";

        if (carrito.length === 0) {
            lista.innerHTML = '<p class="text-muted mb-0">Tu carrito está vacío.</p>';
            total.textContent = dinero(0);
            return;
        }

        carrito.forEach(function (item, indice) {
            var fila = document.createElement("div");
            fila.className = "d-flex justify-content-between align-items-center border-bottom py-2";
            fila.innerHTML =
                '<div>' +
                    '<p class="mb-0">' + escapar(item.nombre) + '</p>' +
                    '<small class="text-muted">' + dinero(item.precio) + ' x ' + item.cantidad + '</small>' +
                '</div>' +
                '<button type="button" class="btn btn-outline-danger btn-sm" data-panel-quitar="' + indice + '">Quitar</button>';
            lista.appendChild(fila);
        });

        total.textContent = dinero(totalDinero(carrito));
    }

    function iniciarPanelCarrito() {
        crearPanelCarrito();

        var lista = document.getElementById("carrito-panel-lista");

        if (lista) {
            lista.addEventListener("click", function (evento) {
                var boton = evento.target.closest("[data-panel-quitar]");
                if (!boton) {
                    return;
                }

                var indice = Number(boton.getAttribute("data-panel-quitar"));
                var carrito = leer(CLAVE_CARRITO);

                if (!carrito[indice]) {
                    return;
                }

                carrito.splice(indice, 1);
                guardar(CLAVE_CARRITO, carrito);
                actualizarContadores();
                dibujarPanelCarrito();
                mostrarToast("Producto quitado del carrito.");
            });
        }

        dibujarPanelCarrito();

        var enlaceCarrito = document.querySelector(".navbar a[href='carrito.html']");
        var esPaginaCarrito = /carrito\.html$/.test(window.location.pathname);

        if (enlaceCarrito && window.bootstrap && !esPaginaCarrito) {
            enlaceCarrito.addEventListener("click", function (evento) {
                evento.preventDefault();
                dibujarPanelCarrito();
                window.bootstrap.Offcanvas.getOrCreateInstance(document.getElementById("carritoPanel")).show();
            });
        }
    }

    document.querySelectorAll("[data-agregar]").forEach(function (boton) {
        boton.addEventListener("click", function () {
            agregarAlCarrito(
                boton.getAttribute("data-id"),
                boton.getAttribute("data-nombre"),
                boton.getAttribute("data-precio")
            );

            dibujarPanelCarrito();
            mostrarToast("Producto añadido al carrito.");

            var textoOriginal = boton.textContent;
            boton.textContent = "Añadido";
            boton.disabled = true;
            window.setTimeout(function () {
                boton.textContent = textoOriginal;
                boton.disabled = false;
            }, 900);

            var aviso = document.getElementById("aviso-carrito");
            if (aviso) {
                aviso.classList.remove("d-none");
            }
        });
    });

    var tablaCarrito = document.getElementById("tabla-carrito");

    if (tablaCarrito) {
        var totalCarrito = document.getElementById("total-carrito");
        var formularioPedido = document.getElementById("form-pedido");
        var alertaPedido = document.getElementById("alerta-pedido");

        function dibujarCarrito() {
            var carrito = leer(CLAVE_CARRITO);
            tablaCarrito.innerHTML = "";

            if (carrito.length === 0) {
                tablaCarrito.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Tu carrito está vacío.</td></tr>';
                totalCarrito.textContent = dinero(0);
                if (formularioPedido) {
                    formularioPedido.classList.add("d-none");
                }
                return;
            }

            if (formularioPedido) {
                formularioPedido.classList.remove("d-none");
            }

            var total = 0;

            carrito.forEach(function (item, indice) {
                var subtotal = item.precio * item.cantidad;
                total += subtotal;

                var fila = document.createElement("tr");
                fila.innerHTML =
                    "<td>" + escapar(item.nombre) + "</td>" +
                    "<td>" + dinero(item.precio) + "</td>" +
                    "<td>" +
                        '<button type="button" class="btn btn-outline-secondary btn-sm" data-accion="menos" data-index="' + indice + '">-</button>' +
                        '<span class="mx-2">' + item.cantidad + '</span>' +
                        '<button type="button" class="btn btn-outline-secondary btn-sm" data-accion="mas" data-index="' + indice + '">+</button>' +
                    "</td>" +
                    "<td>" + dinero(subtotal) + "</td>" +
                    '<td><button type="button" class="btn btn-outline-danger btn-sm" data-accion="quitar" data-index="' + indice + '">Quitar</button></td>';

                tablaCarrito.appendChild(fila);
            });

            totalCarrito.textContent = dinero(total);
        }

        tablaCarrito.addEventListener("click", function (evento) {
            var boton = evento.target.closest("button[data-accion]");
            if (!boton) {
                return;
            }

            var indice = Number(boton.getAttribute("data-index"));
            var accion = boton.getAttribute("data-accion");
            var carrito = leer(CLAVE_CARRITO);

            if (!carrito[indice]) {
                return;
            }

            if (accion === "mas") {
                carrito[indice].cantidad += 1;
            }

            if (accion === "menos") {
                carrito[indice].cantidad -= 1;
                if (carrito[indice].cantidad <= 0) {
                    carrito.splice(indice, 1);
                }
            }

            if (accion === "quitar") {
                carrito.splice(indice, 1);
            }

            guardar(CLAVE_CARRITO, carrito);
            actualizarContadores();
            dibujarCarrito();
        });

        if (formularioPedido) {
            formularioPedido.addEventListener("submit", function (evento) {
                evento.preventDefault();

                var carrito = leer(CLAVE_CARRITO);
                if (carrito.length === 0) {
                    return;
                }

                var nombre = document.getElementById("cliente-nombre").value.trim();
                var correo = document.getElementById("cliente-correo").value.trim();
                var direccion = document.getElementById("cliente-direccion").value.trim();

                if (nombre === "" || correo === "" || direccion === "") {
                    alertaPedido.className = "alert alert-warning";
                    alertaPedido.textContent = "Completa tu nombre, correo y dirección.";
                    return;
                }

                var pedidos = leer(CLAVE_PEDIDOS);
                pedidos.unshift({
                    cliente: nombre,
                    correo: correo,
                    direccion: direccion,
                    items: carrito,
                    total: totalDinero(carrito),
                    fecha: new Date().toISOString()
                });

                guardar(CLAVE_PEDIDOS, pedidos);
                guardar(CLAVE_CARRITO, []);
                actualizarContadores();
                dibujarCarrito();
                formularioPedido.reset();

                alertaPedido.className = "alert alert-success";
                alertaPedido.textContent = "Pedido confirmado. Te enviaremos las instrucciones de pago y entrega por correo.";
            });
        }

        dibujarCarrito();
    }

    var buscadorCatalogo = document.getElementById("buscador-catalogo");

    if (buscadorCatalogo) {
        var listaProductos = document.getElementById("lista-productos");
        var resultadoCatalogo = document.getElementById("resultado-catalogo");
        var sinProductos = document.getElementById("sin-productos");
        var temporizadorCatalogo;

        function filtrarCatalogo() {
            var texto = buscadorCatalogo.value.toLowerCase().trim();
            var tarjetas = listaProductos.children;
            var visibles = 0;

            Array.prototype.forEach.call(tarjetas, function (tarjeta) {
                var coincide = tarjeta.textContent.toLowerCase().indexOf(texto) !== -1;
                tarjeta.classList.toggle("d-none", !coincide);
                if (coincide) {
                    visibles += 1;
                }
            });

            if (resultadoCatalogo) {
                resultadoCatalogo.textContent = visibles + (visibles === 1 ? " producto" : " productos");
            }

            if (sinProductos) {
                sinProductos.classList.toggle("d-none", visibles !== 0);
            }
        }

        buscadorCatalogo.addEventListener("input", function () {
            window.clearTimeout(temporizadorCatalogo);
            temporizadorCatalogo = window.setTimeout(filtrarCatalogo, 200);
        });

        filtrarCatalogo();
    }

    var buscador = document.getElementById("buscador-compatibilidad");

    if (buscador) {
        var tablaCompatibilidad = document.getElementById("tabla-compatibilidad");
        var sinResultados = document.getElementById("sin-resultados");

        buscador.addEventListener("input", function () {
            var texto = buscador.value.toLowerCase();
            var filas = tablaCompatibilidad.querySelectorAll("tbody tr");
            var visibles = 0;

            filas.forEach(function (fila) {
                var coincide = fila.textContent.toLowerCase().indexOf(texto) !== -1;
                fila.classList.toggle("d-none", !coincide);
                if (coincide) {
                    visibles += 1;
                }
            });

            if (sinResultados) {
                sinResultados.classList.toggle("d-none", visibles !== 0);
            }
        });
    }

    var formulario = document.getElementById("formulario");

    if (formulario) {
        var alerta = document.getElementById("alerta");
        var tabla = document.getElementById("tabla-solicitudes");
        var vaciar = document.getElementById("vaciar");
        var botonEnviar = document.getElementById("boton-enviar");

        function mostrarAlerta(texto, tipo) {
            alerta.className = "alert alert-" + tipo + " mt-3 mb-0";
            alerta.textContent = texto;
        }

        function dibujarSolicitudes() {
            var lista = leer(CLAVE_SOLICITUDES);
            tabla.innerHTML = "";

            if (lista.length === 0) {
                tabla.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Todavía no hay pedidos.</td></tr>';
                vaciar.disabled = true;
                return;
            }

            vaciar.disabled = false;

            lista.forEach(function (solicitud, indice) {
                var fila = document.createElement("tr");
                fila.innerHTML =
                    "<td>" + (indice + 1) + "</td>" +
                    "<td>" + escapar(solicitud.cliente) + "</td>" +
                    "<td>" + escapar(solicitud.modelo) + "</td>" +
                    "<td>" + escapar(solicitud.archivo) + "</td>" +
                    "<td>" + escapar(solicitud.plan) + "</td>" +
                    "<td>" + fechaCorta(solicitud.fecha) + "</td>";
                tabla.appendChild(fila);
            });
        }

        formulario.addEventListener("submit", function (evento) {
            evento.preventDefault();

            var cliente = document.getElementById("cliente").value.trim();
            var modelo = document.getElementById("modelo").value.trim();
            var plan = document.getElementById("plan").value;
            var campoArchivo = document.getElementById("archivo");
            var archivo = campoArchivo.files[0];

            if (cliente === "") {
                mostrarAlerta("Escribe tu nombre.", "warning");
                return;
            }

            if (modelo === "") {
                mostrarAlerta("Escribe el modelo del router.", "warning");
                return;
            }

            if (!archivo) {
                mostrarAlerta("Selecciona el archivo de tu firmware actual.", "warning");
                return;
            }

            if (archivo.size > 32 * 1024 * 1024) {
                mostrarAlerta("El archivo supera el máximo de 32 MB.", "warning");
                return;
            }

            botonEnviar.disabled = true;
            botonEnviar.textContent = "Enviando...";

            window.setTimeout(function () {
                var lista = leer(CLAVE_SOLICITUDES);
                lista.unshift({
                    cliente: cliente,
                    modelo: modelo,
                    archivo: archivo.name,
                    tamano: (archivo.size / 1024).toFixed(1) + " KB",
                    plan: plan,
                    fecha: new Date().toISOString()
                });

                guardar(CLAVE_SOLICITUDES, lista);
                dibujarSolicitudes();
                formulario.reset();
                botonEnviar.disabled = false;
                botonEnviar.textContent = "Enviar pedido";
                mostrarAlerta("Pedido recibido. Te contactaremos con los detalles de tu firmware.", "success");
            }, 700);
        });

        vaciar.addEventListener("click", function () {
            if (!confirm("¿Borrar todos los pedidos?")) {
                return;
            }
            guardar(CLAVE_SOLICITUDES, []);
            dibujarSolicitudes();
            mostrarAlerta("Lista de pedidos vaciada.", "secondary");
        });

        dibujarSolicitudes();
    }

    actualizarContadores();
    iniciarPanelCarrito();

    window.addEventListener("storage", actualizarContadores);
})();
