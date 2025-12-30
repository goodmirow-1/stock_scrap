const { ipcRenderer } = require('electron');

window.onload = async () => {
    const tagsList = document.getElementById('tags');
    try {
        const tags = await ipcRenderer.invoke('fetch-tags');
        if (tags.length > 0 && !tags[0].startsWith('Error')) {
            tags.forEach(tag => {
                const li = document.createElement('li');
                li.textContent = tag;
                tagsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.id = 'error';
            li.textContent = tags[0] || '관련 태그를 찾을 수 없습니다.';
            tagsList.appendChild(li);
        }
    } catch (error) {
        const li = document.createElement('li');
        li.id = 'error';
        li.textContent = `Error: ${error.message}`;
        tagsList.appendChild(li);
    }
};