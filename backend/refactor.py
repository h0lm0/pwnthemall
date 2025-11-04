import re

files_to_process = [
    'controllers/challenge_admin.go',
    'controllers/team.go',
    'controllers/challenge.go'
]

for filepath in files_to_process:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace error responses
    content = re.sub(r'c\.JSON\(http\.StatusNotFound, gin\.H\{"error": ([^}]+)\}\)', r'utils.NotFoundError(c, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusBadRequest, gin\.H\{"error": ([^}]+)\}\)', r'utils.BadRequestError(c, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusInternalServerError, gin\.H\{"error": ([^}]+)\}\)', r'utils.InternalServerError(c, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusUnauthorized, gin\.H\{"error": ([^}]+)\}\)', r'utils.UnauthorizedError(c, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusForbidden, gin\.H\{"error": ([^}]+)\}\)', r'utils.ForbiddenError(c, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusConflict, gin\.H\{"error": ([^}]+)\}\)', r'utils.ConflictError(c, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusServiceUnavailable, gin\.H\{"error": ([^}]+)\}\)', r'utils.ErrorResponse(c, 503, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusTooEarly, gin\.H\{"error": ([^}]+)\}\)', r'utils.ErrorResponse(c, 425, \1)', content)
    
    # Replace success responses - but only single-line ones for safety
    content = re.sub(r'c\.JSON\(http\.StatusOK, ([a-zA-Z_][a-zA-Z0-9_]*)\)', r'utils.OKResponse(c, \1)', content)
    content = re.sub(r'c\.JSON\(http\.StatusCreated, ([a-zA-Z_][a-zA-Z0-9_]*)\)', r'utils.CreatedResponse(c, \1)', content)
    
    # Remove net/http import if it exists
    content = re.sub(r'\t"net/http"\n', '', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Replacements complete!")
