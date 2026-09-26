/*
 * Autoflow — réglages de la landing page.
 * C'est le seul fichier à modifier pour brancher le formulaire ou changer l'email de contact.
 */
window.AUTOFLOW_CONFIG = {
  // Adresse affichée sur le site et proposée en secours si l'envoi du formulaire échoue.
  contactEmail: 'contact.autoflow1@gmail.com',

  // Clé d'accès Web3Forms (gratuite) : à créer sur https://web3forms.com avec l'adresse
  // contact.autoflow1@gmail.com. Chaque demande d'audit sera livrée à cette adresse.
  // Tant qu'elle est vide, le formulaire affiche le message d'échec avec l'email de secours.
  web3formsKey: '',
};
