# Réception du formulaire Contact

Le site statique utilise FormSubmit pour adresser les messages à **clementbertrand047@gmail.com**, avec la pièce jointe si elle est présente (10 Mo maximum).

## Activation à effectuer par Clément

1. Faire un premier envoi depuis le formulaire du site.
2. Ouvrir le message de confirmation envoyé par FormSubmit à cette adresse (vérifier les indésirables).
3. Confirmer le formulaire avec le lien du message.
4. Effectuer un nouvel envoi pour contrôler la réception du texte et d’une pièce jointe.

La réception n’est pas vérifiée avant cette activation. Aucun message réel n’a été envoyé automatiquement pendant le développement.

Le formulaire conserve son contenu si le service signale une activation nécessaire ou une erreur. L’interface n’annonce une réussite qu’après confirmation du service. Le bouton Envoyer évite les doubles envois pendant une requête. Les noms de fichiers sont affichés comme texte, et le type multipart conserve les pièces jointes.

Documentation du service : https://formsubmit.co/documentation (sections File uploads et AJAX Forms).
