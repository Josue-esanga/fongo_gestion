"""Page publique d'une annonce (aperçu de partage WhatsApp / Facebook).

Le frontend étant une application monopage, il ne peut pas produire d'aperçu
par annonce : c'est ce template serveur qui porte les balises Open Graph
(``og:image``, ``og:title``…) lues par WhatsApp et Facebook lorsqu'un lien
d'annonce est partagé.
"""

from django.conf import settings
from django.shortcuts import get_object_or_404, render
from django.utils import timezone

from .models import Annonce


def annonce_public(request, annonce_id):
    """GET ``/a/<id>/`` — affiche une annonce **sans connexion**.

    - les annonces réservées aux administrateurs renvoient 404 ;
    - les visuels de l'annonce (affiche recto/verso des modèles FongoExpo et
      visuel des annonces visuelles) sont montrés aux visiteurs ; à défaut,
      la capture du rendu publié (``poster``) ;
    - l'image d'aperçu (``og:image``) est le premier visuel affiché ;
    - le bouton « Ouvrir le dashboard » renvoie vers le frontend.
    """
    annonce = get_object_or_404(
        Annonce.objects.select_related("auteur").exclude(cible="admins"),
        pk=annonce_id,
    )

    # Visuels : l'affiche de l'annonce si elle existe, sinon la capture du
    # rendu publié. L'aperçu partagé reprend le premier visuel affiché.
    affiches = [
        request.build_absolute_uri(fichier.url)
        for fichier in (annonce.image1, annonce.image2)
        if fichier
    ]
    poster_url = (
        request.build_absolute_uri(annonce.poster.url)
        if annonce.poster
        else None
    )
    image_url = affiches[0] if affiches else poster_url

    return render(
        request,
        "annonce/public.html",
        {
            "annonce": annonce,
            "affiches": affiches,
            "poster_url": poster_url,
            "image_url": image_url,
            "og_url": request.build_absolute_uri(request.path),
            "frontend_url": settings.FRONTEND_BASE_URL,
            "year": timezone.now().year,
        },
    )
