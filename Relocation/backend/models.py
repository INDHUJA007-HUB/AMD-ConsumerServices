from sqlalchemy import Column, Integer, String, Float, Numeric, ForeignKey
try:
    from .database import Base
except ImportError:
    from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    starting_location = Column(String, nullable=True)
    workplace = Column(String, nullable=True)
    purpose = Column(String, nullable=True)

class Accommodation(Base):
    __tablename__ = "accommodations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)  # PG, Hostel, House
    rent_price = Column(Numeric)
    latitude = Column(Float)
    longitude = Column(Float)
    safety_score = Column(Float, default=0.0)
    amenities = Column(String) # Simple string or JSON for now

class Amenity(Base):
    __tablename__ = "amenities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String) # Bus Stop, Restaurant, etc.
    latitude = Column(Float)
    longitude = Column(Float)
