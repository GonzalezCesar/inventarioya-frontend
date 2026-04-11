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
} from 'react-native';
import api from '../../services/api';

interface DatabaseInfo {
  tabla: string;
  total: number;
  descripcion?: string;
}

interface DatabaseData {
  version?: string;
  estado?: string;
  tablas?: DatabaseInfo[];
  ultimaActualizacion?: string;
  [key: string]: any;
}

export default function DatabaseScreen() {
  const [dbData, setDbData] = useState<DatabaseData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const loadDatabase = async () => {
    try {
      setIsLoading(true);
      // Esta es una llamada de ejemplo. Ajusta según tu API real
      // const data = await api.get('/database');
      // Por ahora usamos datos de ejemplo
      setDbData({
        version: '1.0.0',
        estado: 'Óptimo',
        ultimaActualizacion: new Date().toLocaleString('es-ES'),
        tablas: [
          {
            tabla: 'usuarios',
            total: 145,
            descripcion: 'Tabla de usuarios registrados',
          },
          {
            tabla: 'productos',
            total: 892,
            descripcion: 'Catálogo de productos',
          },
          {
            tabla: 'categorias',
            total: 24,
            descripcion: 'Categorías de productos',
          },
          {
            tabla: 'clientes',
            total: 356,
            descripcion: 'Base de clientes',
          },
          {
            tabla: 'ventas',
            total: 1204,
            descripcion: 'Registro de ventas',
          },
          {
            tabla: 'caja',
            total: 89,
            descripcion: 'Movimientos de caja',
          },
        ],
      });
    } catch (error) {
      console.log('[Database] Error loading database info:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la base de datos.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDatabase();
  };

  const toggleTableExpand = (tabla: string) => {
    setExpandedTable(expandedTable === tabla ? null : tabla);
  };

  const tablas = dbData.tablas || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View>
              <Text style={styles.statusLabel}>Estado de la Base de Datos</Text>
              <Text
                style={[
                  styles.statusValue,
                  {
                    color: dbData.estado === 'Óptimo' ? '#10b981' : '#f59e0b',
                  },
                ]}
              >
                {dbData.estado || 'Desconocido'}
              </Text>
            </View>
            <View>
              <Text style={styles.statusLabel}>Última Actualización</Text>
              <Text style={styles.statusValue}>
                {dbData.ultimaActualizacion || '---'}
              </Text>
            </View>
          </View>

          {/* Tables List */}
          <View style={styles.tablesSection}>
            <Text style={styles.sectionTitle}>Tablas de la Base de Datos</Text>
            <Text style={styles.sectionSubtitle}>
              {tablas.length} tablas
            </Text>

            <View style={styles.tablesList}>
              {tablas.map((table) => {
                const isExpanded = expandedTable === table.tabla;

                return (
                  <TouchableOpacity
                    key={table.tabla}
                    style={styles.tableCard}
                    onPress={() => toggleTableExpand(table.tabla)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tableHeader}>
                      <View style={styles.tableInfo}>
                        <Text style={styles.tableName}>{table.tabla}</Text>
                        <Text style={styles.tableRecords}>
                          {table.total} registros
                        </Text>
                      </View>
                      <View style={styles.expandIcon}>
                        <Text style={styles.expandIconText}>
                          {isExpanded ? '▼' : '▶'}
                        </Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.tableDetails}>
                        <Text style={styles.tableDescription}>
                          {table.descripcion || 'Sin descripción'}
                        </Text>

                        <View style={styles.tableStats}>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total de Registros</Text>
                            <Text style={styles.statValue}>{table.total}</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Tabla</Text>
                            <Text style={styles.statValue}>{table.tabla}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen General</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total de Tablas</Text>
                <Text style={styles.summaryValue}>{tablas.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total de Registros</Text>
                <Text style={styles.summaryValue}>
                  {tablas.reduce((acc, t) => acc + (t.total || 0), 0)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  tablesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  tablesList: {
    gap: 10,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  tableRecords: {
    fontSize: 13,
    color: '#999',
  },
  expandIcon: {
    paddingLeft: 12,
  },
  expandIconText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  tableDetails: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
  },
  tableDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  tableStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});
