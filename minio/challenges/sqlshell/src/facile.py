import socket
import pymysql
import os

def execute_command(cursor, query):
    """
    Exécute la requête SQL fournie par l'utilisateur.
    """
    try:
        cursor.execute(query)
        return cursor.fetchall()
    except Exception as e:
        return [str(e)]

def start_server(cursor):
    """
    Démarre un serveur qui exécute des commandes SQL fournies par l'utilisateur.
    """
    host = '0.0.0.0'
    port = 25000

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        server_socket.bind((host, port))
        server_socket.listen(1)
        print(f"Serveur démarré, écoute sur le port {port}...")

        while True:
            client_socket, client_address = server_socket.accept()
            print(f"Connexion acceptée de {client_address}")

            with client_socket:
                client_socket.send(b'Bienvenue sur la calculette SQL\n')
                client_socket.send(b"Vous pouvez effectuer des additions et des soustractions.\n")

                while True:
                    try:
                        client_socket.send(b"Premier nombre: ")
                        first_input = client_socket.recv(1024).decode('utf-8').strip()

                        client_socket.send(b"Operateur (+ ou -) : ")
                        operator = client_socket.recv(1024).decode('utf-8').strip()

                        if operator not in ('+', '-'):
                            client_socket.send(b"Erreur : operateur non supporte. Nous acceptons uniquement '+' ou '-'.\n")
                            continue

                        client_socket.send(b"Deuxieme nombre: ")
                        second_input = client_socket.recv(1024).decode('utf-8').strip()

                        query = f"SELECT {first_input} {operator} {second_input}"
                        print(f"Requête exécutée : {query}")

                        result = execute_command(cursor, query)

                        if result:
                            response = '\n'.join(str(row[0]) for row in result)
                            client_socket.sendall(response.encode('utf-8') + b"\n")
                        else:
                            client_socket.sendall(b"Aucune sortie ou erreur.\n")
                    except Exception as e:
                        client_socket.sendall(b"Une erreur est survenue.\n")
                        print(f"Erreur : {e}")

            print(f"Connexion fermée avec {client_address}")

if __name__ == '__main__':
    connection = pymysql.connect(
        host='localhost',
        user='unph',      
        password= os.environ['MYSQL_PASSWORD'],
        database='ctf_db', 
        charset='utf8mb4',
        cursorclass=pymysql.cursors.Cursor
    )

    cursor = connection.cursor()
    start_server(cursor)
