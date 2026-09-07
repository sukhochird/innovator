from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user(token):
    from apps.accounts.models import User

    try:
        access = AccessToken(token)
        return User.objects.get(pk=access["user_id"])
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = dict(x.split("=") for x in query_string.split("&") if "=" in x)
        token = params.get("token")
        if token:
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()
        return await super().__call__(scope, receive, send)
