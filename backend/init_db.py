import psycopg2

DB_URL = "postgresql://postgres:NeuroCLIAI2003@db.sntpdiocjraunscswatq.supabase.co:5432/postgres"

def create_tables():
    commands = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
            role TEXT,
            content TEXT,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    ]
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        for command in commands:
            cur.execute(command)
        conn.commit()
        cur.close()
        conn.close()
        print("Tables created successfully!")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    create_tables()
