"""Retain original scans and document rejection reasons without changing legacy rows."""

import sqlalchemy as sa
from alembic import op

revision = "c260911_document_review"
down_revision = "b260906_operations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("original_content", sa.LargeBinary(), nullable=True))
    op.add_column("documents", sa.Column("original_media_type", sa.String(50), nullable=True))
    op.add_column("documents", sa.Column("original_filename", sa.String(200), nullable=True))
    op.add_column("documents", sa.Column("rejection_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    for name in (
        "rejection_reason",
        "original_filename",
        "original_media_type",
        "original_content",
    ):
        op.drop_column("documents", name)
