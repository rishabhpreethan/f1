import requests
from PIL import Image
from io import BytesIO
import os

# Team logo URLs - using official or high-quality sources
TEAM_LOGOS = {
    'alpine': 'https://media.formula1.com/content/dam/fom-website/teams/2024/alpine.png',
    'aston-martin': 'https://media.formula1.com/content/dam/fom-website/teams/2024/aston-martin.png',
    'ferrari': 'https://media.formula1.com/content/dam/fom-website/teams/2024/ferrari.png',
    'haas': 'https://media.formula1.com/content/dam/fom-website/teams/2024/haas.png',
    'mclaren': 'https://media.formula1.com/content/dam/fom-website/teams/2024/mclaren.png',
    'mercedes': 'https://media.formula1.com/content/dam/fom-website/teams/2024/mercedes.png',
    'rb-f1-team': 'https://media.formula1.com/content/dam/fom-website/teams/2024/alphatauri.png',
    'red-bull': 'https://media.formula1.com/content/dam/fom-website/teams/2023/red-bull-racing.png',
    'sauber': 'https://media.formula1.com/content/dam/fom-website/teams/2024/alfa-romeo.png',
    'williams': 'https://media.formula1.com/content/dam/fom-website/teams/2024/williams.png'
}

# Create output directory if it doesn't exist
output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'cars')
os.makedirs(output_dir, exist_ok=True)

# Target dimensions
TARGET_SIZE = (300, 300)

def process_logo(url, team_name):
    try:
        # Download image
        response = requests.get(url)
        response.raise_for_status()
        
        # Open image and convert to RGBA
        img = Image.open(BytesIO(response.content)).convert('RGBA')
        
        # Create a new white background image
        background = Image.new('RGBA', TARGET_SIZE, (255, 255, 255, 0))
        
        # Resize image maintaining aspect ratio
        img.thumbnail((TARGET_SIZE[0] - 40, TARGET_SIZE[1] - 40), Image.Resampling.LANCZOS)
        
        # Calculate position to center the image
        position = ((TARGET_SIZE[0] - img.width) // 2, (TARGET_SIZE[1] - img.height) // 2)
        
        # Paste the resized image onto the background
        background.paste(img, position, img)
        
        # Save the processed image
        output_path = os.path.join(output_dir, f'{team_name}.png')
        background.save(output_path, 'PNG', optimize=True)
        print(f'Successfully processed {team_name}')
        
    except Exception as e:
        print(f'Error processing {team_name}: {str(e)}')

def main():
    for team_name, url in TEAM_LOGOS.items():
        process_logo(url, team_name)
        print(f'Processed {team_name}')

if __name__ == '__main__':
    main()
