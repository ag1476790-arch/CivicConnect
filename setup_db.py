import os
import re
from pathlib import Path

import MySQLdb
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / 'backend' / '.env')

DB_NAME = os.getenv('DB_NAME', 'civicconnect_db')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))

if not re.fullmatch(r'[A-Za-z0-9_]+', DB_NAME):
    raise ValueError('DB_NAME may contain only letters, numbers, and underscores.')


def create_database():
    conn = MySQLdb.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, passwd=DB_PASSWORD, charset='utf8mb4')
    try:
        cursor = conn.cursor()
        try:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            conn.commit()
        finally:
            cursor.close()
    finally:
        conn.close()
    print(f'Database {DB_NAME} is ready.')


if __name__ == '__main__':
    create_database()
    print('Next step: run python backend/manage.py migrate and python backend/manage.py seed_data')
