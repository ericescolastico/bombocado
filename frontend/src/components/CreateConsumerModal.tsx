'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { api } from '@/lib/api';
import { FontAwesomeIcon } from '@/lib/fontawesome';
import { CreateConsumerDto, DocumentType } from '@/types/consumer';

interface CreateConsumerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  zipcode: string;
  docNumber: string;
  docType: string;
  consumerNotes: string;
}

interface FormErrors {
  firstName?: string;
  email?: string;
  phone?: string;
  zipcode?: string;
  docNumber?: string;
  general?: string;
}

export const CreateConsumerModal: React.FC<CreateConsumerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    zipcode: '',
    docNumber: '',
    docType: '',
    consumerNotes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Primeiro nome é obrigatório';
    }

    // Validação opcional do email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação opcional do telefone
    if (formData.phone) {
      const cleaned = formData.phone.replace(/\D/g, '');
      if (cleaned.length < 10) {
        newErrors.phone = 'Telefone inválido';
      }
    }

    // Validação opcional do CEP
    if (formData.zipcode) {
      const cleaned = formData.zipcode.replace(/\D/g, '');
      if (cleaned.length !== 8) {
        newErrors.zipcode = 'CEP deve ter 8 dígitos';
      }
    }

    // Validação opcional do documento
    if (formData.docNumber && formData.docType) {
      const cleaned = formData.docNumber.replace(/\D/g, '');
      if (formData.docType === 'CPF' && cleaned.length !== 11) {
        newErrors.docNumber = 'CPF deve ter 11 dígitos';
      } else if (formData.docType === 'CNPJ' && cleaned.length !== 14) {
        newErrors.docNumber = 'CNPJ deve ter 14 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateConsumerDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        zipcode: formData.zipcode.trim() || undefined,
        docNumber: formData.docNumber.trim() || undefined,
        docType: formData.docType ? (formData.docType as DocumentType) : undefined,
        consumerNotes: formData.consumerNotes.trim() || undefined,
      };

      await api.post('/consumers', payload);
      
      // Limpar formulário
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        zipcode: '',
        docNumber: '',
        docType: '',
        consumerNotes: '',
      });
      setErrors({});
      
      // Fechar modal e recarregar lista
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      
      if (error.response?.status === 409) {
        setErrors({ general: 'Email já está em uso por outro cliente' });
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Erro ao criar cliente. Tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        zipcode: '',
        docNumber: '',
        docType: '',
        consumerNotes: '',
      });
      setErrors({});
      onClose();
    }
  };

  const getDocTypeLabel = (docType: string): string => {
    const labels: Record<string, string> = {
      'CPF': 'CPF',
      'CNPJ': 'CNPJ',
      'RG': 'RG',
      'OUTRO': 'Outro',
    };
    return labels[docType] || docType;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!isLoading}
      isKeyboardDismissDisabled={isLoading}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Cadastrar Novo Cliente</h2>
          </ModalHeader>
          <ModalBody>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <Input
                label="Primeiro Nome"
                placeholder="Digite o primeiro nome"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                isRequired
                isInvalid={!!errors.firstName}
                errorMessage={errors.firstName}
                isDisabled={isLoading}
              />

              {/* Last Name */}
              <Input
                label="Sobrenome"
                placeholder="Digite o sobrenome (opcional)"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                isDisabled={isLoading}
              />

              {/* Email */}
              <Input
                label="Email"
                type="email"
                placeholder="cliente@exemplo.com (opcional)"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                isDisabled={isLoading}
              />

              {/* Phone */}
              <Input
                label="Telefone"
                type="tel"
                placeholder="(00) 00000-0000 (opcional)"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                isInvalid={!!errors.phone}
                errorMessage={errors.phone}
                isDisabled={isLoading}
              />

              {/* Address */}
              <Input
                label="Endereço"
                placeholder="Rua, número, complemento (opcional)"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                isDisabled={isLoading}
                className="md:col-span-2"
              />

              {/* Zipcode */}
              <Input
                label="CEP"
                placeholder="00000-000 (opcional)"
                value={formData.zipcode}
                onChange={(e) => handleChange('zipcode', e.target.value)}
                isInvalid={!!errors.zipcode}
                errorMessage={errors.zipcode}
                isDisabled={isLoading}
              />

              {/* Document Type */}
              <Select
                label="Tipo de Documento"
                placeholder="Selecione o tipo (opcional)"
                selectedKeys={formData.docType ? new Set([formData.docType]) : new Set()}
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0] as string;
                  if (selectedValue) {
                    handleChange('docType', selectedValue);
                  } else {
                    handleChange('docType', '');
                  }
                }}
                isDisabled={isLoading}
              >
                <SelectItem key="CPF">CPF</SelectItem>
                <SelectItem key="CNPJ">CNPJ</SelectItem>
                <SelectItem key="RG">RG</SelectItem>
                <SelectItem key="OUTRO">Outro</SelectItem>
              </Select>

              {/* Document Number */}
              <Input
                label="Número do Documento"
                placeholder="Digite o número do documento (opcional)"
                value={formData.docNumber}
                onChange={(e) => handleChange('docNumber', e.target.value)}
                isInvalid={!!errors.docNumber}
                errorMessage={errors.docNumber}
                isDisabled={isLoading}
              />
            </div>

            {/* Consumer Notes */}
            <Textarea
              label="Notas Internas"
              placeholder="Anotações sobre o cliente (opcional)"
              value={formData.consumerNotes}
              onChange={(e) => handleChange('consumerNotes', e.target.value)}
              isDisabled={isLoading}
              minRows={3}
              className="mt-2"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={handleClose}
              isDisabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isLoading}
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar Cliente'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

