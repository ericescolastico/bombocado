'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from '@heroui/react';
import { api } from '@/lib/api';
import { FontAwesomeIcon } from '@/lib/fontawesome';

interface Role {
  roleId: string;
  roleName: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  roleName: string;
}

interface FormErrors {
  username?: string;
  firstName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  roleName?: string;
  general?: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    roleName: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Carregar roles disponíveis (exceto ADMIN)
  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const { data } = await api.get<Role[]>('/users/roles');
      // Filtrar ADMIN
      const filteredRoles = data.filter(role => role.roleName !== 'ADMIN');
      setRoles(filteredRoles);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      setErrors({ general: 'Erro ao carregar roles disponíveis' });
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Primeiro nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!formData.roleName) {
      newErrors.roleName = 'Role é obrigatória';
    }

    // Validação opcional do telefone
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Telefone inválido';
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
      const payload = {
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || undefined,
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        roleName: formData.roleName,
      };

      await api.post('/users', payload);
      
      // Limpar formulário
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        roleName: '',
      });
      setErrors({});
      
      // Fechar modal e recarregar lista
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      if (error.response?.status === 409) {
        setErrors({ general: 'Usuário ou email já existe' });
      } else if (error.response?.status === 403) {
        setErrors({ general: 'Não é permitido criar usuários ADMIN' });
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Erro ao criar usuário. Tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        roleName: '',
      });
      setErrors({});
      onClose();
    }
  };

  const getRoleLabel = (roleName: string): string => {
    const labels: Record<string, string> = {
      'ATENDENTE': 'Atendente',
      'PRODUÇÃO': 'Produção',
      'CAIXA': 'Caixa',
    };
    return labels[roleName] || roleName;
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
            <h2 className="text-xl font-semibold">Criar Novo Usuário</h2>
          </ModalHeader>
          <ModalBody>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <Input
                label="Nome de Usuário"
                placeholder="Digite o nome de usuário"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                isRequired
                isInvalid={!!errors.username}
                errorMessage={errors.username}
                isDisabled={isLoading}
              />

              {/* Email */}
              <Input
                label="Email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                isRequired
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                isDisabled={isLoading}
              />

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

              {/* Password */}
              <Input
                label="Senha"
                type={passwordVisible ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                isRequired
                isInvalid={!!errors.password}
                errorMessage={errors.password}
                isDisabled={isLoading}
                endContent={
                  <button
                    type="button"
                    className="focus:outline-none text-gray-500 hover:text-gray-700"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={passwordVisible ? 'eye-slash' : 'eye'} className="w-4 h-4" />
                  </button>
                }
              />

              {/* Confirm Password */}
              <Input
                label="Confirmar Senha"
                type={confirmPasswordVisible ? 'text' : 'password'}
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                isRequired
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword}
                isDisabled={isLoading}
                endContent={
                  <button
                    type="button"
                    className="focus:outline-none text-gray-500 hover:text-gray-700"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={confirmPasswordVisible ? 'eye-slash' : 'eye'} className="w-4 h-4" />
                  </button>
                }
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

              {/* Role */}
              <Select
                label="Perfil"
                placeholder="Selecione o perfil"
                selectedKeys={formData.roleName ? new Set([formData.roleName]) : new Set()}
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0] as string;
                  if (selectedValue) {
                    handleChange('roleName', selectedValue);
                  }
                }}
                isRequired
                isInvalid={!!errors.roleName}
                errorMessage={errors.roleName}
                isDisabled={isLoading || loadingRoles}
                isLoading={loadingRoles}
              >
                {roles.map((role) => (
                  <SelectItem key={role.roleName} value={role.roleName}>
                    {getRoleLabel(role.roleName)}
                  </SelectItem>
                ))}
              </Select>
            </div>
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
              isDisabled={loadingRoles}
            >
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
