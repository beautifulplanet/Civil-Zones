import os

file_path = r"c:\Users\Elite\Documents\My Made Games\Civil Zones Beta 0\CitGame Early version 2\Civil Zones\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_tag = "<style>"
end_tag = "</style>"

start_index = content.find(start_tag)
end_index = content.find(end_tag)

if start_index != -1 and end_index != -1:
    new_content = content[:start_index] + '<link rel="stylesheet" href="css/styles.css">' + content[end_index + len(end_tag):]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced style block with link.")
else:
    print("Could not find style block.")
