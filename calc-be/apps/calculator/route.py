from fastapi import APIRouter
import base64
from io import BytesIO
from apps.calculator.utils import analyseImage
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post('')
async def solve_image(data: ImageData):
    image_data = base64.b64decode(data.image.split(',')[1])
    image_bytes = BytesIO(image_data)
    image = Image.open(image_bytes)
    responses = analyseImage(image, data.dict_of_vars)
    data = []
    for response in responses:
        data.append(response)
    print('response in route: ', responses)
    return {
        "message": "Image analysed successfully",
        "status": "success",
        "data": data
    }
    