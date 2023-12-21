FROM mongo

ENV ADMIN_USER a
ENV ADMIN_PSSWD a
ENV APP_USER a
ENV APP_PSSWD a
ENV DB_NAME a
ENV NET_NAME a

COPY test.init-db.sh /test.init-db.sh

CMD ["bash", "-c", "/test.init-db.sh"]