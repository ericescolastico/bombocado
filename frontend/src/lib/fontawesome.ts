import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Importar ícones específicos que vamos usar
import { 
  faBriefcase, // Dashboard
  faUsers, // Usuários
  faBox, // Produtos
  faClipboardList, // Pedidos
  faCog, // Configurações
  faEdit, // Editar
  faEnvelope, // Mensagens
  faBell, // Notificações
  faSignOutAlt, // Logout
  faChevronLeft, // Seta esquerda
  faEye, // Mostrar senha
  faEyeSlash, // Ocultar senha
  faUser, // Usuário/Login
  faSpinner, // Loading
  faCheck, // Check/Sucesso
  faCamera, // Câmera/Foto
  faChevronDown, // Dropdown
  faChevronUp, // Dropdown up
  faSyncAlt, // Sincronizar/Atualizar
  faTachometerAlt, // Dashboard/Tachômetro
  faHistory, // Histórico
  faRotateLeft, // Rotacionar/Voltar
  faExclamationTriangle, // Aviso/Erro
  faSearch, // Busca
  faPlus, // Adicionar/Criar
  faTrash, // Excluir
  faColumns, // Colunas/Kanban
  faHeadset, // Atendimento/Headset
  faTimes, // Fechar/X
  faUserPlus, // Adicionar usuário
  faInbox, // Caixa de entrada/Inbox
  faComments, // Comentários/Conversas
  faUserCog, // Configurações de usuário
  faAddressBook, // Endereço/Endereço
  faBars, // Barras/Menu
} from '@fortawesome/free-solid-svg-icons';

// Adicionar ícones à biblioteca
library.add(
  faBriefcase,
  faUsers,
  faBox,
  faClipboardList,
  faCog,
  faEdit,
  faEnvelope,
  faBell,
  faSignOutAlt,
  faChevronLeft,
  faEye,
  faEyeSlash,
  faUser,
  faSpinner,
  faCheck,
  faCamera,
  faChevronDown,
  faChevronUp,
  faSyncAlt,
  faTachometerAlt,
  faHistory,
  faRotateLeft,
  faExclamationTriangle,
  faSearch,
  faPlus,
  faTrash,
  faColumns,
  faHeadset,
  faTimes,
  faUserPlus,
  faInbox,
  faComments,
  faUserCog,
  faAddressBook, 
  faBars,
);

export { FontAwesomeIcon };
