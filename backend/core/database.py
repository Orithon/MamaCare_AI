from motor.motor_asyncio import AsyncIOMotorClient
from core.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]

    # Create indexes for fast lookups
    await db.users.create_index("firebase_uid", unique=True)
    await db.users.create_index("email", unique=True)
    await db.patient_profiles.create_index("user_id")
    await db.predictions.create_index("patient_id")
    await db.predictions.create_index([("patient_id", 1), ("created_at", -1)])
    await db.reports.create_index("patient_id")
    await db.chat_history.create_index("patient_id")
    await db.provider_notes.create_index([("patient_id", 1), ("created_at", -1)])
    await db.health_tips.create_index([("patient_id", 1), ("date", -1)])

    print("✅ MongoDB connected and indexes created")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("MongoDB disconnected")


def get_db():
    return db
