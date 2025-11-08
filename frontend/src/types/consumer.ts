export type DocumentType = 'CPF' | 'CNPJ' | 'RG' | 'OUTRO';
export type Gender = 'MASCULINO' | 'FEMININO' | 'OUTRO' | 'PREFIRO_NAO_INFORMAR';

export interface Consumer {
  consumerId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  address?: string;
  zipcode?: string;
  phone?: string;
  docNumber?: string;
  docType?: DocumentType;
  gender?: Gender;
  state?: string;
  city?: string;
  consumerNotes?: string;
  createdById: string;
  createdBy: {
    userId: string;
    firstName: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateConsumerDto {
  firstName: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  address?: string;
  zipcode?: string;
  phone?: string;
  docNumber?: string;
  docType?: DocumentType;
  gender?: Gender;
  state?: string;
  city?: string;
  consumerNotes?: string;
}

export interface UpdateConsumerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  address?: string;
  zipcode?: string;
  phone?: string;
  docNumber?: string;
  docType?: DocumentType;
  gender?: Gender;
  state?: string;
  city?: string;
  consumerNotes?: string;
}

