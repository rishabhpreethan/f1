import os
import requests

# List of nationalities in F1 (add more if needed)
nationalities = [
    'British', 'Dutch', 'Mexican', 'Spanish', 'French', 'Australian', 'German',
    'Finnish', 'Danish', 'Canadian', 'Japanese', 'Chinese', 'Thai', 'American',
    'Italian', 'Brazilian', 'Russian', 'Polish', 'Belgian', 'Swedish', 'Austrian',
    'Swiss', 'Hungarian', 'Portuguese', 'Monegasque', 'New Zealander'
]

# Create flags directory if it doesn't exist
flags_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'flag-images')
os.makedirs(flags_dir, exist_ok=True)

print(f'Downloading flags to: {flags_dir}')

# Download flags for each nationality
for nationality in nationalities:
    # Get two-letter country code
    country_code = {
        'British': 'gb',
        'Dutch': 'nl',
        'Mexican': 'mx',
        'Spanish': 'es',
        'French': 'fr',
        'Australian': 'au',
        'German': 'de',
        'Finnish': 'fi',
        'Danish': 'dk',
        'Canadian': 'ca',
        'Japanese': 'jp',
        'Chinese': 'cn',
        'Thai': 'th',
        'American': 'us',
        'Italian': 'it',
        'Brazilian': 'br',
        'Russian': 'ru',
        'Polish': 'pl',
        'Belgian': 'be',
        'Swedish': 'se',
        'Austrian': 'at',
        'Swiss': 'ch',
        'Hungarian': 'hu',
        'Portuguese': 'pt',
        'Monegasque': 'mc',
        'New Zealander': 'nz'
    }.get(nationality)

    if country_code:
        # Download flag
        url = f'https://flagcdn.com/w80/{country_code}.png'
        response = requests.get(url)
        if response.status_code == 200:
            flag_path = os.path.join(flags_dir, f'{country_code}.png')
            with open(flag_path, 'wb') as f:
                f.write(response.content)
            print(f'Downloaded flag for {nationality} ({country_code}) to {flag_path}')
        else:
            print(f'Failed to download flag for {nationality} ({country_code})')
    else:
        print(f'No country code found for {nationality}')
