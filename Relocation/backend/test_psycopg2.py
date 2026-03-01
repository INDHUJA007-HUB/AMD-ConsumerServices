import psycopg2
try:
    conn = psycopg2.connect(
        dbname='nammaway',
        user='postgres',
        password='hi',
        host='localhost'
    )
    print("Connection to nammaway: Success")
    cur = conn.cursor()
    cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    conn.commit()
    print("PostGIS enabled successfully")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
