"""Routes racine du backend FongoGestion.

Le backend est une API REST : aucune vue applicative n'y est exposée, à
l'exception de la page publique d'annonce ``/a/<id>/`` (template autonome,
sans connexion) qui porte les balises Open Graph des partages WhatsApp et
Facebook. Seul l'admin Django reste disponible.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from annonce.views import annonce_public


def api_root(request):
    """Point d'entrée JSON : indique où se trouve l'API."""
    return JsonResponse(
        {
            'name': 'FongoGestion API',
            'version': '1.0.0',
            'status': 'ok',
            'api': request.build_absolute_uri('/api/'),
            'docs': request.build_absolute_uri('/api/docs/'),
            'redoc': request.build_absolute_uri('/api/redoc/'),
            'schema': request.build_absolute_uri('/api/schema/'),
        }
    )


def health(request):
    """Sonde de disponibilité (utilisée par le frontend / le monitoring)."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('', api_root, name='api-root'),
    path('health/', health, name='health'),
    # Page publique d'une annonce : affichée sans connexion aux personnes qui
    # cliquent sur un lien partagé (WhatsApp / Facebook), avec l'aperçu image.
    path(
        'a/<int:annonce_id>/',
        annonce_public,
        name='annonce-public',
    ),
    path('admin/', admin.site.urls),
    path('api/', include('Fongo_Gestion.api_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
