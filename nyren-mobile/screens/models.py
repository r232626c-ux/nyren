from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Text, JSON, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

class LearningModule(Base):
    __tablename__ = "learning_modules"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String) # e.g., CORE_BIOINFORMATICS
    difficulty = Column(String, default="beginner")
    estimated_duration = Column(Integer) # minutes
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    contents = relationship("ModuleContent", back_populates="module", cascade="all, delete-orphan")

class ModuleContent(Base):
    __tablename__ = "module_contents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id = Column(String, ForeignKey("learning_modules.id"))
    title = Column(String, nullable=False)
    content_type = Column(String) # video, reading, quiz, lab, project
    body_text = Column(Text)
    video_url = Column(String)
    interactive_data = Column(JSON) # For labs and quizzes
    order_index = Column(Integer, default=0)
    
    module = relationship("LearningModule", back_populates="contents")

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_uuid = Column(String, index=True)
    module_id = Column(String, ForeignKey("learning_modules.id"))
    content_id = Column(String, ForeignKey("module_contents.id"))
    status = Column(String) # in_progress, completed, mastered
    score = Column(Float, default=0.0)
    notes = Column(Text)
    time_spent = Column(Integer, default=0)
    last_accessed = Column(DateTime, default=datetime.utcnow)

class ResearchProject(Base):
    __tablename__ = "research_hub"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    track = Column(String) # Cancer Genomics, Drug Discovery
    title = Column(String)
    dataset_uri = Column(String)
    ai_mentor_context = Column(Text)
    is_published = Column(Boolean, default=False)