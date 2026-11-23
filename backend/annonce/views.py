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
    - l'image d'aperçu est la capture de partage (``poster``), à défaut
      l'image de l'annonce (``image1``) ;
    - le bouton « Ouvrir le dashboard » renvoie vers le frontend.
    """
    annonce = get_object_or_404(
        Annonce.objects.select_related("auteur").exclude(cible="admins"),
        pk=annonce_id,
    )

    image = annonce.poster or annonce.image1
    image_url = request.build_absolute_uri(image.url) if image else None

    return render(
        request,
        "annonce/public.html",
        {
            "annonce": annonce,
            "image_url": image_url,
            "og_url": request.build_absolute_uri(request.path),
            "frontend_url": settings.FRONTEND_BASE_URL,
            "year": timezone.now().year,
        },
    )
