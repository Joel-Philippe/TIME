'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCamera, faClipboardList, faShoppingCart, faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import styles from './Home.module.css';
import DisplayNameForm from '@/components/DisplayNameForm';
import ProfilePhotoForm from '@/components/ProfilePhotoForm';
import Purchases from '@/components/Purchases';
import Messages from '@/components/Messages';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import FooterMenu from '@/components/FooterMenu';
import Header from '@/components/Header';
import Front from '../pages/front';
import { CheckboxProvider } from '@/contexts/CheckboxContext';
import { GlobalCartProvider, useGlobalCart } from "@/components/GlobalCartContext";
import GlobalPrice from '@/components/globalprice'; // ✅ Ajout du panier global

import './Cards.css';

export default function Home() {
  const auth = useAuth();         // ✅ récupère l'objet auth
  const user = auth?.user;        // ✅ accède à `user` de manière sécurisée

  return (
    <CheckboxProvider>
      <GlobalCartProvider>
        <InnerHome user={user} />
      </GlobalCartProvider>
    </CheckboxProvider>
  );
}

function InnerHome({ user }: { user: any }) {
  const { globalCart } = useGlobalCart();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openModal = (modalType: string) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);

  const cartCount = Object.values(globalCart).reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <Front />

      {user && (
        <div className={styles.footerContainer}>
          <div className={styles.menuButtons}>
            <button
              onClick={() => setIsCartOpen(true)}
              className={`${styles.cartButton} ${cartCount > 0 ? styles.activeCart : ''}`}
            >
              <FontAwesomeIcon icon={faShoppingCart} className={styles.icon} /> Panier
              {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
            </button>
          </div>
        </div>
      )}

      <GlobalPrice isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {activeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {activeModal === 'displayName'
                ? 'Modifier le Pseudo'
                : activeModal === 'profilePhoto'
                ? 'Modifier la Photo de Profil'
                : activeModal === 'specialRequests'
                ? 'Demandes Spéciales'
                : activeModal === 'purchases'
                ? 'Achats'
                : activeModal === 'messages'
                ? 'Messages'
                : activeModal === 'changePassword'
                ? 'Mot de Passe'
                : ''}
              <button className={styles.modalCloseButton} onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {renderModalContent(activeModal)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function renderModalContent(modalType: string | null) {
  switch (modalType) {
    case 'displayName':
      return <DisplayNameForm />;
    case 'profilePhoto':
      return <ProfilePhotoForm />;
    case 'specialRequests':
    case 'purchases':
      return <Purchases />;
    case 'messages':
      return <Messages />;
    case 'changePassword':
      return <ChangePasswordForm />;
    default:
      return null;
  }
}
