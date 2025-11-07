'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { CreateConsumerModal } from '@/components/CreateConsumerModal';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import { Avatar } from '@heroui/react';
import api from '@/lib/api';
import { Consumer } from '@/types/consumer';

function ListaClientesContent() {
  usePageTitle('Lista de Clientes');
  
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadConsumers();
  }, []);

  const loadConsumers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/consumers');
      setConsumers(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar lista de clientes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDocument = (docNumber?: string, docType?: string) => {
    if (!docNumber) return '-';
    if (!docType) return docNumber;
    
    const cleaned = docNumber.replace(/\D/g, '');
    
    if (docType === 'CPF' && cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    } else if (docType === 'CNPJ' && cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    
    return docNumber;
  };

  const getFullName = (consumer: Consumer) => {
    return consumer.lastName 
      ? `${consumer.firstName} ${consumer.lastName}` 
      : consumer.firstName;
  };

  if (isLoading) {
    return (
      <div className="px-8 pb-16">
        <div className="mt-6 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Carregando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 pb-16">
        <div className="mt-6 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon="exclamation-triangle" className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Erro ao carregar clientes
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
            <button
              onClick={loadConsumers}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-16">
      {/* Cabeçalho */}
      <div className="mt-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Lista de Clientes
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {consumers.length} {consumers.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            <FontAwesomeIcon icon="user-plus" className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>
          <button
            onClick={loadConsumers}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon="sync-alt" className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabela */}
      {consumers.length === 0 ? (
        <div className="mt-8 flex items-center justify-center h-96 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon="address-book" className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Nenhum cliente cadastrado
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Os clientes cadastrados aparecerão aqui
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Cadastrado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Cadastrado por
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {consumers.map((consumer) => (
                  <tr
                    key={consumer.consumerId}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={consumer.profileImage}
                          name={consumer.firstName}
                          size="sm"
                          radius="full"
                          showFallback
                        />
                        <div>
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {getFullName(consumer)}
                          </div>
                          {consumer.email && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                              {consumer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {formatPhone(consumer.phone)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {formatDocument(consumer.docNumber, consumer.docType)}
                      </div>
                      {consumer.docType && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {consumer.docType}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {consumer.address || '-'}
                      </div>
                      {consumer.zipcode && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          CEP: {consumer.zipcode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {formatDate(consumer.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {consumer.createdBy.firstName} {consumer.createdBy.lastName || ''}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Cliente */}
      <CreateConsumerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadConsumers();
        }}
      />
    </div>
  );
}

export default function ListaClientesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ListaClientesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

