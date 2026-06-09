# app/models/__init__.py
# Import all models here so Alembic (and init_db) can discover them.
from app.models.user import User, UserRole
from app.models.family import Family
from app.models.family_member import FamilyMember, MemberRole
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.category import Category
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal, GoalPriority, GoalStatus
from app.models.ai_insight import AIInsight
from app.models.notification import Notification
from app.models.uploaded_file import UploadedFile
from app.models.recurring_transaction import RecurringTransaction, RecurrenceFrequency
from app.models.report import Report

__all__ = [
    "User", "UserRole",
    "Family",
    "FamilyMember", "MemberRole",
    "Transaction", "TransactionType", "TransactionStatus",
    "Category",
    "Budget",
    "SavingsGoal", "GoalPriority", "GoalStatus",
    "AIInsight",
    "Notification",
    "UploadedFile",
    "RecurringTransaction", "RecurrenceFrequency",
    "Report",
]
