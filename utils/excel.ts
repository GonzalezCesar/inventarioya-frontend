import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

const COLUMNAS = [
  "NOMBRE",
  "SKU",
  "PRECIO",
  "COSTO",
  "STOCK",
  "STOCK MINIMO",
  "CATEGORIA",
  "CODIGO DE BARRAS",
  "PROVEEDOR",
  "DESCRIPCION",
];

export const descargarPlantillaExcel = async (): Promise<boolean> => {
  try {
    const wb = XLSX.utils.book_new();
    const wsData = [COLUMNAS];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = COLUMNAS.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const nombreArchivo = `Plantilla_Productos.xlsx`;
    const uri = `${FileSystem.cacheDirectory}${nombreArchivo}`;

    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: "base64" as any,
    });

    if (!(await Sharing.isAvailableAsync())) return false;

    await Sharing.shareAsync(uri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Descargar Plantilla",
    });
    return true;
  } catch (error) {
    console.error("Error generando plantilla:", error);
    return false;
  }
};

export const procesarExcelImportacion = async (
  categorias: any[],
): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets)
      return { success: false, error: "Cancelado" };

    const fileContent = await FileSystem.readAsStringAsync(
      result.assets[0].uri,
      { encoding: "base64" as any },
    );

    const wb = XLSX.read(fileContent, { type: "base64" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (data.length < 2)
      return {
        success: false,
        error: "El archivo está vacío o solo tiene encabezados",
      };

    const normalize = (s: string) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const headersNorm = (data[0] as string[]).map(normalize);
    const getIdx = (name: string) => headersNorm.indexOf(normalize(name));

    const idx = {
      nombre: getIdx(COLUMNAS[0]),
      sku: getIdx(COLUMNAS[1]),
      precio: getIdx(COLUMNAS[2]),
      costo: getIdx(COLUMNAS[3]),
      stock: getIdx(COLUMNAS[4]),
      stockMinimo: getIdx(COLUMNAS[5]),
      categoria: getIdx(COLUMNAS[6]),
      codigo: getIdx(COLUMNAS[7]),
      proveedor: getIdx(COLUMNAS[8]),
      descripcion: getIdx(COLUMNAS[9]),
    };

    if (idx.nombre === -1 || idx.precio === -1)
      return { success: false, error: "Faltan columnas de Nombre o Precio" };

    const productos = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || !row[idx.nombre]) continue;

      const nombreCat = String(row[idx.categoria] || "").trim();
      const cat = categorias.find(
        (c) => normalize(c.nombre) === normalize(nombreCat),
      );

      productos.push({
        nombre: String(row[idx.nombre]).trim(),
        sku: idx.sku !== -1 ? String(row[idx.sku] || "").trim() : "",
        precio: Number(row[idx.precio]) || 0,
        costo: Number(row[idx.costo]) || 0,
        stock: Number(row[idx.stock]) || 0,
        stock_minimo: Number(row[idx.stockMinimo]) || 5,
        categoria_id: cat ? cat.id : null,
        codigo_barras:
          idx.codigo !== -1 ? String(row[idx.codigo] || "").trim() : "",
        proveedor:
          idx.proveedor !== -1 ? String(row[idx.proveedor] || "").trim() : "",
        descripcion:
          idx.descripcion !== -1
            ? String(row[idx.descripcion] || "").trim()
            : "",
      });
    }
    return { success: true, data: productos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
