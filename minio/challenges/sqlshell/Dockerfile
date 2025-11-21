FROM mysql:8.0-debian as mysql-base

COPY init.sql /docker-entrypoint-initdb.d/

ENV MYSQL_ROOT_PASSWORD=5HW0IjRWFkMzOXLDbXt2HPjXx5sgID
ENV MYSQL_DATABASE=ctf_db
ENV MYSQL_USER=unph
ENV MYSQL_PASSWORD=5UA6fd8q0VVGIVoN6UBQxQi4xvRdDq

FROM mysql-base as final

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

ENV MYSQL_PASSWORD=5UA6fd8q0VVGIVoN6UBQxQi4xvRdDq

RUN pip3 install --break-system-packages --no-cache-dir pymysql cryptography python-dotenv

WORKDIR /app
COPY src/facile.py /app/challenge.py
COPY src/start.sh /start.sh

RUN chmod u+x /start.sh

EXPOSE 25000

CMD ["bash", "/start.sh"]
