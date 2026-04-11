import { API_URL, ENDPOINTS } from "../config/env";
import { ApiResponse, LoginResponse } from "../types";

interface ApiError {
  error: string;
  message?: string;
  detalles?: any[];
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_URL;
  }

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        const match = text.match(/<b>(.*?)<\/b>/);
        const mensaje = match ? match[1] : text.substring(0, 200);
        throw new Error(
          `El servidor devolvió una respuesta inesperada: ${mensaje}`,
        );
      }

      if (!response.ok) {
        const errorObj = {
          message:
            data.error || data.message || "Error en la petición al servidor",
          detalles: data.detalles || [],
          status: response.status,
        };
        throw errorObj;
      }

      return data as T;
    } catch (error: any) {
      console.log(
        `[API Service] Error en ${endpoint}:`,
        error.message || error,
      );
      throw error;
    }
  }

  // --- AUTENTICACIÓN ---
  async login(email: string, contrasena: string): Promise<LoginResponse> {
    return this.request<LoginResponse>(ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ email, contrasena }),
    });
  }

  async register(userData: any): Promise<LoginResponse> {
    return this.request<LoginResponse>(ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async validateToken(): Promise<ApiResponse> {
    return this.request<ApiResponse>(ENDPOINTS.VALIDATE_TOKEN, {
      method: "GET",
    });
  }

  async getMe(): Promise<any> {
    return this.request<any>(ENDPOINTS.ME, {
      method: "GET",
    });
  }

  async heartbeat(): Promise<ApiResponse> {
    return this.request<ApiResponse>(ENDPOINTS.HEARTBEAT, {
      method: "GET",
    });
  }

  // --- GENÉRICO ---
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // --- PRODUCTOS ---
  async getProductos(): Promise<any[]> {
    return this.get<any[]>(ENDPOINTS.PRODUCTOS);
  }

  async getProducto(id: string): Promise<any> {
    return this.get<any>(`${ENDPOINTS.PRODUCTOS}/${id}`);
  }

  async createProducto(producto: any): Promise<any> {
    return this.post<any>(ENDPOINTS.PRODUCTOS, producto);
  }

  async updateProducto(id: string, producto: any): Promise<any> {
    return this.put<any>(`${ENDPOINTS.PRODUCTOS}/${id}`, producto);
  }

  async deleteProducto(id: string): Promise<any> {
    return this.delete<any>(`${ENDPOINTS.PRODUCTOS}/${id}`);
  }

  // --- CATEGORÍAS ---
  async getCategorias(): Promise<any[]> {
    return this.get<any[]>(ENDPOINTS.CATEGORIAS);
  }

  async getCategoria(id: string): Promise<any> {
    return this.get<any>(`${ENDPOINTS.CATEGORIAS}/${id}`);
  }

  async createCategoria(categoria: any): Promise<any> {
    return this.post<any>(ENDPOINTS.CATEGORIAS, categoria);
  }

  async updateCategoria(id: string, categoria: any): Promise<any> {
    return this.put<any>(`${ENDPOINTS.CATEGORIAS}/${id}`, categoria);
  }

  async deleteCategoria(id: string): Promise<any> {
    return this.delete<any>(`${ENDPOINTS.CATEGORIAS}/${id}`);
  }

  // --- CLIENTES ---
  async getClientes(): Promise<any[]> {
    return this.get<any[]>(ENDPOINTS.CLIENTES);
  }

  async getCliente(id: string): Promise<any> {
    return this.get<any>(`${ENDPOINTS.CLIENTES}/${id}`);
  }

  async createCliente(cliente: any): Promise<any> {
    return this.post<any>(ENDPOINTS.CLIENTES, cliente);
  }

  async updateCliente(id: string, cliente: any): Promise<any> {
    return this.put<any>(`${ENDPOINTS.CLIENTES}/${id}`, cliente);
  }

  async deleteCliente(id: string): Promise<any> {
    return this.delete<any>(`${ENDPOINTS.CLIENTES}/${id}`);
  }

  // --- VENTAS ---
  async getVentas(): Promise<any[]> {
    return this.get<any[]>(ENDPOINTS.VENTAS);
  }

  async getVenta(id: string): Promise<any> {
    return this.get<any>(`${ENDPOINTS.VENTAS}/${id}`);
  }

  async createVenta(venta: any): Promise<any> {
    return this.post<any>(ENDPOINTS.VENTAS, venta);
  }

  async updateVenta(id: string, venta: any): Promise<any> {
    return this.put<any>(`${ENDPOINTS.VENTAS}/${id}`, venta);
  }

  async deleteVenta(id: string): Promise<any> {
    return this.delete<any>(`${ENDPOINTS.VENTAS}/${id}`);
  }

  async getVentasKardex(productoId: string): Promise<any> {
    return this.get<any>(
      `${ENDPOINTS.VENTAS}/kardex?producto_id=${productoId}`,
    );
  }

  // --- CAJA ---
  async getCaja(): Promise<any> {
    return this.get<any>(ENDPOINTS.CAJA);
  }

  // --- CONFIGURACIÓN ---
  async getConfiguracion(): Promise<Record<string, string>> {
    return this.get<Record<string, string>>(ENDPOINTS.CONFIGURACION);
  }

  // --- DASHBOARD ---
  async getDashboard(): Promise<any> {
    return this.get<any>(ENDPOINTS.DASHBOARD);
  }
}

export const api = new ApiService();
export default api;
