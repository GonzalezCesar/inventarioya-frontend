import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import api from '../../services/api';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  cedula?: string;
  activo: boolean;
}

export default function UsuariosScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtrados, setFiltrados] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const loadClientes = async () => {
    try {
      setIsLoading(true);
      const data = await api.getClientes();
      setClientes(data || []);
      setFiltrados(data || []);
    } catch (error) {
      console.log('[Usuarios] Error loading clientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClientes();
  };

  const handleSearch = (text: string) => {
    setBusqueda(text);
    if (!text.trim()) {
      setFiltrados(clientes);
    } else {
      const filtered = clientes.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(text.toLowerCase()) ||
          (cliente.email && cliente.email.toLowerCase().includes(text.toLowerCase())) ||
          (cliente.cedula && cliente.cedula.includes(text))
      );
      setFiltrados(filtered);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            value={busqueda}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : filtrados.length > 0 ? (
          <View style={styles.listContainer}>
            {filtrados.map((cliente) => (
              <View key={cliente.id} style={styles.clienteCard}>
                <View style={styles.clienteHeader}>
                  <Text style={styles.clienteName}>{cliente.nombre}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: cliente.activo
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: cliente.activo ? '#10b981' : '#ef4444',
                        },
                      ]}
                    >
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>

                {cliente.email && (
                  <Text style={styles.clienteEmail}>{cliente.email}</Text>
                )}

                {cliente.telefono && (
                  <Text style={styles.clienteInfo}>Tel: {cliente.telefono}</Text>
                )}

                {cliente.cedula && (
                  <Text style={styles.clienteInfo}>Cédula: {cliente.cedula}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {busqueda ? 'No se encontraron resultados' : 'No hay clientes'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  clienteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clienteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clienteEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  clienteInfo: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
});
