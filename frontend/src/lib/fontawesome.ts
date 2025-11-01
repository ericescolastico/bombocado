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
);

export { FontAwesomeIcon };
