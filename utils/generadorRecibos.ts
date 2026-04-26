import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generarReciboHTML = (venta: any, nombreNegocio: string): string => {
    // Formatear la fecha
    const fecha = new Date(venta.fecha || Date.now());
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Formatear Método de Pago
    const diccionarioPagos: Record<string, string> = {
        efectivo: 'Efectivo',
        tarjeta: 'Tarjeta',
        transferencia: 'Transferencia',
        pago_movil: 'Pago Móvil',
        credito: 'Crédito',
        mixto: 'Mixto',
    };
    const metodoPagoTexto = diccionarioPagos[venta.metodoPago || venta.metodo_pago] || venta.metodoPago || 'N/A';

    // Formatear Estado
    const estadoPagoTexto = {
        completo: 'Pagado Completo',
        pendiente: 'Pendiente de Pago',
        parcial: 'Pago Parcial',
    }[venta.estadoPago || venta.estado_pago] || 'Completado';

    const estadoColor = venta.estadoPago === 'completo' ? '#00FF88' : (venta.estadoPago === 'parcial' ? '#FFD60A' : '#FF3B30');
    const estadoTextoColor = venta.estadoPago === 'completo' ? '#000' : (venta.estadoPago === 'parcial' ? '#000' : '#fff');

    // Determinar nombre de cliente (a veces viene el objeto, a veces solo el string)
    const clienteNombre = venta.cliente?.nombre || venta.clienteNombre || 'Mostrador';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Arial', sans-serif; padding: 20px; background: #fff; }
                .recibo { max-width: 400px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
                .negocio-nombre { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                .negocio-info { font-size: 12px; color: #666; }
                .seccion { margin-bottom: 15px; }
                .seccion-titulo { font-weight: bold; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; color: #333; }
                .fila { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
                .fila-item { border-bottom: 1px dashed #ddd; padding: 8px 0; }
                .fila-item-nombre { font-weight: 500; }
                .fila-item-detalle { display: flex; justify-content: space-between; font-size: 12px; color: #666; }
                .totales { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; margin: 15px 0; }
                .total-final { font-size: 18px; font-weight: bold; }
                .pago-info { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
                .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${estadoColor}; color: ${estadoTextoColor}; }
            </style>
        </head>
        <body>
            <div class="recibo">
                <div class="header">
                    <div class="negocio-nombre">${nombreNegocio}</div>
                    <div class="negocio-info">Este documento no tiene validez fiscal.</div>
                </div>

                <div class="seccion">
                    <div class="fila">
                        <span>Recibo #:</span>
                        <strong>${(venta.id || 'NUEVA').substring(0, 8).toUpperCase()}</strong>
                    </div>
                    <div class="fila">
                        <span>Fecha:</span>
                        <span>${fechaFormateada}</span>
                    </div>
                    <div class="fila">
                        <span>Cliente:</span>
                        <span>${clienteNombre}</span>
                    </div>
                </div>

                <div class="seccion">
                    <div class="seccion-titulo">Productos</div>
                    ${(venta.items || []).map((item: any) => `
                        <div class="fila-item">
                            <div class="fila-item-nombre">${item.producto?.nombre || item.nombre || 'Producto'}</div>
                            <div class="fila-item-detalle">
                                <span>${item.cantidad} x $${Number(item.precioUnitario || item.precio || 0).toFixed(2)}</span>
                                <strong>$${Number(item.subtotal || 0).toFixed(2)}</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="totales">
                    <div class="fila total-final">
                        <span>TOTAL:</span>
                        <span>$${Number(venta.total || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div class="pago-info">
                    <div class="fila">
                        <span>Método de Pago:</span>
                        <strong>${metodoPagoTexto}</strong>
                    </div>
                    <div class="fila">
                        <span>Monto Pagado:</span>
                        <strong>$${Number(venta.montoPagado || 0).toFixed(2)}</strong>
                    </div>
                    ${Number(venta.montoRestante || 0) > 0 ? `
                        <div class="fila">
                            <span>Saldo Pendiente:</span>
                            <strong style="color: #FF3B30;">$${Number(venta.montoRestante).toFixed(2)}</strong>
                        </div>
                    ` : ''}
                    <div class="fila">
                        <span>Estado:</span>
                        <span class="badge">${estadoPagoTexto}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>¡Gracias por su compra!</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

export const generarYCompartirRecibo = async (venta: any, nombreNegocio: string = 'INVENTARIO YA'): Promise<void> => {
    try {
        const html = generarReciboHTML(venta, nombreNegocio);

        const { uri } = await Print.printToFileAsync({
            html,
            base64: false,
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Recibo #${(venta.id || 'Nuevo').substring(0, 8).toUpperCase()}`,
                UTI: 'com.adobe.pdf',
            });
        } else {
            throw new Error('La función de compartir no está disponible en este dispositivo');
        }
    } catch (error) {
        console.error('Error al generar recibo:', error);
        throw error;
    }
};