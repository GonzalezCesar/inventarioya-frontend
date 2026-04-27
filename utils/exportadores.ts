import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { API_URL_UPLOADS } from "../config/env";

// Asegúrate de que esta sea la IP de tu backend

export const exportarInventarioExcel = async (
  productos: any[],
  categorias: any[],
): Promise<boolean> => {
  try {
    const data = productos.map((p) => {
      const cat = categorias.find(
        (c) => String(c.id) === String(p.categoria_id),
      );
      return {
        Nombre: p.nombre,
        SKU: p.sku,
        Categoría: cat ? cat.nombre : "Sin Categoría",
        Stock: p.stock,
        Costo: p.costo,
        Precio: p.precio,
        "Código de Barras": p.codigo_barras || "",
        Proveedor: p.proveedor || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");

    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = `${FileSystem.cacheDirectory}Inventario.xlsx`;

    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: "base64" as any,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const exportarCatalogoPDF = async (
  productos: any[],
  categorias: any[],
): Promise<boolean> => {
  try {
    const htmlProductos = productos
      .map((p) => {
        const cat = categorias.find(
          (c) => String(c.id) === String(p.categoria_id),
        );
        let imagenSrc = "https://via.placeholder.com/300?text=Sin+Imagen";
        if (p.imagen) imagenSrc = `${API_URL_UPLOADS}${p.imagen}`;

        return `
                <div style="width: 100%; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-after: always;">
                    <img src="${imagenSrc}" style="max-height: 50vh; max-width: 80%; object-fit: contain; border: 3px solid #D4FF00; border-radius: 20px; margin-bottom: 20px; padding: 10px;" />
                    <h1 style="font-size: 50px; margin: 0; color: #121212;">${p.nombre}</h1>
                    <span style="background: #D4FF00; color: #121212; padding: 10px 30px; border-radius: 30px; font-size: 24px; font-weight: bold; margin: 20px 0;">${cat ? cat.nombre : "General"}</span>
                    <h2 style="font-size: 60px; color: #8FBF13; margin: 0;">$${p.precio}</h2>
                </div>
            `;
      })
      .join("");

    const html = `<html><body style="font-family: Arial; margin:0; padding:0; background: #fff; text-align: center;">${htmlProductos}</body></html>`;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: "com.adobe.pdf" });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
