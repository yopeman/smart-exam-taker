import base64
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as UploadFileField
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.file import File

router = APIRouter()


@router.post("/upload")
def upload_file(
    file: Annotated[UploadFile, UploadFileField()],
    db: Session = Depends(get_db),
) -> dict:
    """Upload a file and return its ID."""
    try:
        data = file.file.read()
        size = len(data)
        
        db_file = File(data=data, size=size)
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return {"id": db_file.id, "size": size}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.post("/upload-base64")
def upload_base64(
    base64_data: str,
    db: Session = Depends(get_db),
) -> dict:
    """Upload base64 encoded data and return its ID."""
    try:
        # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]
        
        data = base64.b64decode(base64_data)
        size = len(data)
        
        db_file = File(data=data, size=size)
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return {"id": db_file.id, "size": size}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload base64 data: {str(e)}")


@router.get("/{file_id}")
def get_file(
    file_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get file data by ID as base64."""
    db_file = db.query(File).filter(File.id == file_id).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if db_file.is_deleted:
        raise HTTPException(status_code=404, detail="File has been deleted")
    
    base64_data = base64.b64encode(db_file.data).decode("utf-8")
    
    return {
        "id": db_file.id,
        "size": db_file.size,
        "data": base64_data,
    }


@router.get("/{file_id}/binary")
def get_file_binary(
    file_id: str,
    db: Session = Depends(get_db),
) -> bytes:
    """Get file data by ID as binary."""
    db_file = db.query(File).filter(File.id == file_id).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if db_file.is_deleted:
        raise HTTPException(status_code=404, detail="File has been deleted")
    
    return db_file.data
