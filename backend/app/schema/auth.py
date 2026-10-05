from pydantic import BaseModel

class TokenData(BaseModel):
    id:int

class Token(BaseModel):
    access_token:str
    token_type:str