(function() {
    'use strict';

    // Create a unique class name for our elements
    const STYLES_ID = 'image-replacer-styles';
    const CONTAINER_ID = 'image-replacer-container';

    // Check if styles are already added
    if (!document.getElementById(STYLES_ID)) {
        const styles = document.createElement('style');
        styles.id = STYLES_ID;
        styles.textContent = `
      #${CONTAINER_ID} {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 100000;
        background: rgba(255, 255, 255, 0.98);
        border: 2px solid #2196F3;
        border-radius: 8px;
        padding: 0;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
      }
      
      #${CONTAINER_ID}.collapsed {
        max-height: 46px;
        overflow: hidden;
      }
      
      #${CONTAINER_ID}.collapsed .replacer-content {
        display: none;
      }
      
      .replacer-header {
        display: flex;
        gap:10px;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ddd;
        position: sticky;
        top: 0;
        background: rgba(255, 255, 255, 0.98);
        z-index: 1;
        margin-bottom: 15px;
      }
      
      #${CONTAINER_ID} .replacer-content {
        padding: 0 15px 15px 15px;
        flex: 1;
        overflow-y: auto;
      }
      
      .replacer-title {
        font-weight: bold;
        color: #2196F3;
        font-size: 16px;
      }
      
      .replacer-header-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .toggle-btn, .reload-btn {
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .toggle-btn:hover, .reload-btn:hover {
        background: #0d8bf2;
      }
      
      .reload-btn {
        background: #FF9800;
      }
      
      .reload-btn:hover {
        background: #F57C00;
      }
      
      .image-set {
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: #f9f9f9;
      }
      
      .set-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;
      }
      
      .preview-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      .preview-img {
        width: 100%;
        max-width: 200px;
        height: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .preview-img:hover {
        transform: scale(1.02);
        border-color: #2196F3;
      }
      
      .replace-btn, .download-btn {
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .replace-btn:hover {
        background: #45a049;
      }
      
      .download-btn {
        background: #2196F3;
      }
      
      .download-btn:hover {
        background: #0d8bf2;
      }
      
      .preview-buttons {
        display: flex;
        gap: 8px;
        width: 100%;
        justify-content: center;
      }
      
      .file-input {
        display: none;
      }
      
      .count-badge {
        background: #2196F3;
        color: white;
        border-radius: 10px;
        padding: 2px 8px;
        font-size: 11px;
      }
      
      .status-message {
        margin-top: 8px;
        padding: 5px;
        border-radius: 4px;
        font-size: 12px;
        text-align: center;
      }
      
      .success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .image-replacer-target {
        position: relative;
      }
      
      .image-hover-btn {
        position: fixed;
        background: rgba(76, 175, 80, 0.9);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 11px;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: none;
      }
      
      .image-hover-btn.visible {
        display: block !important;
        opacity: 1;
        pointer-events: auto;
      }
      
      .image-hover-btn:hover {
        background: rgba(69, 160, 73, 1);
      }
    `;
        document.head.appendChild(styles);
    }

    // Function to get all visible images
    function getVisibleImages() {
        return Array.from(document.querySelectorAll('img[src^="https://lh3.googleusercontent.com"]')).filter(img => {
            const parentCwiz = img.closest('c-wiz');
            return parentCwiz && parentCwiz.style.display !== 'none';
        }
        );
    }

    // Group images by src using Map (more appropriate than Set for key-value pairs)
    function groupImagesBySrc(images) {
        const imageMap = new Map();

        images.forEach(img => {
            const src = img.src;
            if (!imageMap.has(src)) {
                imageMap.set(src, []);
            }
            imageMap.get(src).push(img);
        }
        );

        return imageMap;
    }

    // Create file input element
    function createFileInput(src) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'file-input';
        input.dataset.originalSrc = src;

        return input;
    }

    // Extract app name and app id from Chrome Web Store URL
    function extractAppInfoFromUrl(url) {
        const match = url.match(/chromewebstore\.google\.com\/detail\/([^\/]+)\/([^\/\?]+)/);
        if (match) {
            return {
                appName: match[1],
                appId: match[2]
            };
        }
        return null;
    }

    // Get URL for image naming - tries multiple sources
    function getUrlForImageNaming(img) {
        // Option 1: Try img.parent.parent.querySelector for link with CWS URL
        try {
            const parent = img.parentElement;
            if (parent) {
                const grandParent = parent.parentElement;
                if (grandParent) {
                    const link = grandParent.querySelector('a[href*="detail"]');
                    if (link && link.href) {
                        return link.href;
                    }
                }
            }
        } catch (e) {
            // Ignore errors
        }

        // Option 2: Use current page location
        if (window.location.href) {
            return window.location.href;
        }

        // Option 3: Default
        return null;
    }

    // Generate filename for download
    function generateImageFilename(img) {
        const url = getUrlForImageNaming(img);
        const appInfo = url ? extractAppInfoFromUrl(url) : null;

        if (appInfo) {
            return `${appInfo.appName}_${appInfo.appId}`;
        }

        return 'cws_img';
    }

    // Download image
    function downloadImage(img, imageSrc) {
        const filename = generateImageFilename(img);
        
        // Get file extension from image src or default to png
        let extension = 'png';
        try {
            const urlMatch = imageSrc.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i);
            if (urlMatch) {
                extension = urlMatch[1].toLowerCase();
            }
        } catch (e) {
            // Use default
        }

        // Fetch the image and download
        fetch(imageSrc)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                console.error('Error downloading image:', err);
                // Fallback: try direct download if fetch fails (for data URLs)
                if (imageSrc.startsWith('data:')) {
                    const a = document.createElement('a');
                    a.href = imageSrc;
                    a.download = `${filename}.${extension}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            });
    }

    // Handle file upload and replacement - reusable function
    function handleFileUpload(file, originalSrc, imageElements, statusElement, options = {}) {
        if (!file.type.startsWith('image/')) {
            if (statusElement) {
                statusElement.textContent = 'Please select an image file';
                statusElement.className = 'status-message error';
            }
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            const newSrc = e.target.result;

            // Replace all images in the imageElements array (no need to find them by src)
            imageElements.forEach(img => {
                img.src = newSrc;
                // Also replace srcset if it exists
                if (img.srcset) {
                    img.srcset = newSrc;
                }
            }
            );

            // Update preview image if statusElement is in a panel
            if (statusElement) {
                const previewImg = statusElement.closest('.image-set')?.querySelector('.preview-img');
                if (previewImg) {
                    previewImg.src = newSrc;
                }

                // Also update the file input's dataset for future replacements
                const fileInput = statusElement.closest('.image-set')?.querySelector('.file-input');
                if (fileInput) {
                    fileInput.dataset.originalSrc = newSrc;
                }

                statusElement.textContent = `✓ Replaced ${imageElements.length} image(s)`;
                statusElement.className = 'status-message success';

                // Clear status after 3 seconds
                setTimeout( () => {
                    statusElement.textContent = '';
                    statusElement.className = 'status-message';
                }
                , 3000);
            }

            // Update imageMap if provided (for hover button replacements)
            if (options.onReplace) {
                options.onReplace(newSrc, originalSrc);
            }
        }
        ;

        reader.onerror = function() {
            if (statusElement) {
                statusElement.textContent = 'Error reading file';
                statusElement.className = 'status-message error';
            }
        }
        ;

        reader.readAsDataURL(file);
    }

    // Create image set element
    function createImageSetElement(src, images, imageMap) {
        const setDiv = document.createElement('div');
        setDiv.className = 'image-set';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'set-header';

        const srcInfo = document.createElement('span');
        srcInfo.textContent = `${images.length} image(s)`;

        const countBadge = document.createElement('span');
        countBadge.className = 'count-badge';
        countBadge.textContent = images.length;

        headerDiv.appendChild(srcInfo);
        headerDiv.appendChild(countBadge);

        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';

        const previewImg = document.createElement('img');
        previewImg.className = 'preview-img';
        previewImg.src = src;
        previewImg.alt = 'Preview';
        previewImg.title = 'Click to replace this image';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'preview-buttons';

        const replaceBtn = document.createElement('button');
        replaceBtn.className = 'replace-btn';
        replaceBtn.textContent = 'Replace';
        replaceBtn.title = 'Replace this image';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.title = 'Download this image';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-message';

        const fileInput = createFileInput(src);

        // Event listeners
        previewImg.addEventListener('click', () => fileInput.click());
        replaceBtn.addEventListener('click', () => fileInput.click());
        downloadBtn.addEventListener('click', () => {
            // Use the first image from the set to get context for naming
            const contextImg = images[0];
            downloadImage(contextImg, src);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Get the current src from dataset (which we update after each replacement)
                const currentSrc = e.target.dataset.originalSrc;
                handleFileUpload(file, currentSrc, images, statusDiv, {
                    onReplace: (newSrc, oldSrc) => {
                        // Update imageMap when replacement happens
                        if (imageMap.has(oldSrc)) {
                            const updatedImages = imageMap.get(oldSrc);
                            imageMap.delete(oldSrc);
                            imageMap.set(newSrc, updatedImages);
                            
                            // Update all hover button file inputs for this image set
                            updatedImages.forEach(updatedImg => {
                                const data = imageButtonMap.get(updatedImg);
                                if (data && data.fileInput) {
                                    data.fileInput.dataset.originalSrc = newSrc;
                                }
                            });
                        }
                    }
                });
                // Reset the file input so same file can be selected again
                e.target.value = '';
            }
        }
        );

        buttonsContainer.appendChild(replaceBtn);
        buttonsContainer.appendChild(downloadBtn);

        previewContainer.appendChild(previewImg);
        previewContainer.appendChild(buttonsContainer);
        previewContainer.appendChild(fileInput);
        previewContainer.appendChild(statusDiv);

        setDiv.appendChild(headerDiv);
        setDiv.appendChild(previewContainer);

        return setDiv;
    }

    // Map to store button and file input references for each image
    const imageButtonMap = new WeakMap();

    // Cleanup function to remove all classes, buttons and containers
    function cleanup() {
        // Remove all hover buttons and classes
        document.querySelectorAll('.image-replacer-target').forEach(img => {
            img.classList.remove('image-replacer-target');
            const data = imageButtonMap.get(img);
            if (data) {
                if (data.button && data.button.parentNode) {
                    data.button.parentNode.removeChild(data.button);
                }
                if (data.fileInput && data.fileInput.parentNode) {
                    data.fileInput.parentNode.removeChild(data.fileInput);
                }
                imageButtonMap.delete(img);
            }
        });
        
        // Remove container
        const container = document.getElementById(CONTAINER_ID);
        if (container) {
            container.remove();
        }
    }

    // Attach hover buttons to images
    function attachHoverButtons(imageMap) {
        // Remove existing hover buttons first
        document.querySelectorAll('.image-replacer-target').forEach(img => {
            img.classList.remove('image-replacer-target');
            const data = imageButtonMap.get(img);
            if (data) {
                if (data.button && data.button.parentNode) {
                    data.button.parentNode.removeChild(data.button);
                }
                if (data.fileInput && data.fileInput.parentNode) {
                    data.fileInput.parentNode.removeChild(data.fileInput);
                }
                imageButtonMap.delete(img);
            }
        });

        imageMap.forEach((images, src) => {
            images.forEach(img => {
                // Skip if already processed
                if (img.classList.contains('image-replacer-target')) {
                    return;
                }

                // Add class to image
                img.classList.add('image-replacer-target');

                // Create hover button
                const hoverBtn = document.createElement('button');
                hoverBtn.className = 'image-hover-btn';
                hoverBtn.textContent = 'Change';
                hoverBtn.title = 'Replace this image';
                hoverBtn.style.display = 'none';

                // Create file input for this button
                const fileInput = createFileInput(src);
                document.body.appendChild(fileInput);

                // Store references
                imageButtonMap.set(img, { button: hoverBtn, fileInput: fileInput });

                // Position button on hover
                const updateButtonPosition = () => {
                    const rect = img.getBoundingClientRect();
                    hoverBtn.style.top = (rect.top + 5) + 'px';
                    hoverBtn.style.right = (window.innerWidth - rect.right + 5) + 'px';
                    hoverBtn.classList.add('visible');
                };

                const hideButton = () => {
                    hoverBtn.classList.remove('visible');
                };

                img.addEventListener('mouseenter', updateButtonPosition);
                img.addEventListener('mouseleave', hideButton);
                hoverBtn.addEventListener('mouseenter', updateButtonPosition);
                hoverBtn.addEventListener('mouseleave', hideButton);
                
                // Update position on scroll/resize when visible
                const updateOnScroll = () => {
                    if (hoverBtn.classList.contains('visible')) {
                        updateButtonPosition();
                    }
                };
                window.addEventListener('scroll', updateOnScroll, true);
                window.addEventListener('resize', updateOnScroll);

                // Append button to body
                document.body.appendChild(hoverBtn);

                // Event listener for hover button
                hoverBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fileInput.click();
                });

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const currentSrc = e.target.dataset.originalSrc;
                        // Create a temporary status element for feedback
                        const tempStatus = document.createElement('div');
                        tempStatus.className = 'status-message';
                        tempStatus.style.position = 'fixed';
                        tempStatus.style.top = '50%';
                        tempStatus.style.left = '50%';
                        tempStatus.style.transform = 'translate(-50%, -50%)';
                        tempStatus.style.zIndex = '100001';
                        tempStatus.style.padding = '10px 20px';
                        document.body.appendChild(tempStatus);

                        handleFileUpload(file, currentSrc, images, tempStatus, {
                            onReplace: (newSrc, oldSrc) => {
                                // Update imageMap
                                if (imageMap.has(oldSrc)) {
                                    const updatedImages = imageMap.get(oldSrc);
                                    imageMap.delete(oldSrc);
                                    imageMap.set(newSrc, updatedImages);
                                    
                                    // Update all file inputs for this image set
                                    updatedImages.forEach(updatedImg => {
                                        const data = imageButtonMap.get(updatedImg);
                                        if (data && data.fileInput) {
                                            data.fileInput.dataset.originalSrc = newSrc;
                                        }
                                    });
                                    
                                    // Update panel preview if it exists
                                    const container = document.getElementById(CONTAINER_ID);
                                    if (container) {
                                        const imageSet = Array.from(container.querySelectorAll('.image-set')).find(set => {
                                            const previewImg = set.querySelector('.preview-img');
                                            return previewImg && previewImg.src === oldSrc;
                                        });
                                        if (imageSet) {
                                            const previewImg = imageSet.querySelector('.preview-img');
                                            if (previewImg) {
                                                previewImg.src = newSrc;
                                            }
                                            const panelFileInput = imageSet.querySelector('.file-input');
                                            if (panelFileInput) {
                                                panelFileInput.dataset.originalSrc = newSrc;
                                            }
                                        }
                                    }
                                }
                                
                                // Remove temp status after showing success
                                setTimeout(() => {
                                    if (tempStatus.parentNode) {
                                        tempStatus.parentNode.removeChild(tempStatus);
                                    }
                                }, 2000);
                            }
                        });
                        e.target.value = '';
                    }
                });
            });
        });
    }

    // Create or update the container
    function createContainer(imageMap) {
        // Remove existing container if it exists
        const existingContainer = document.getElementById(CONTAINER_ID);
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = CONTAINER_ID;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'replacer-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'replacer-title';
        titleDiv.textContent = `Image Sets (${imageMap.size})`;

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'replacer-header-buttons';

        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'reload-btn';
        reloadBtn.textContent = 'Reload';
        reloadBtn.title = 'Reload and re-scan images';
        reloadBtn.addEventListener('click', () => {
            cleanup();
            main();
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.textContent = 'Collapse';

        let isCollapsed = false;
        toggleBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            container.classList.toggle('collapsed', isCollapsed);
            toggleBtn.textContent = isCollapsed ? 'Expand' : 'Collapse';
        }
        );

        buttonsContainer.appendChild(reloadBtn);
        buttonsContainer.appendChild(toggleBtn);

        headerDiv.appendChild(titleDiv);
        headerDiv.appendChild(buttonsContainer);
        container.appendChild(headerDiv);

        // Create content wrapper for scrollable content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'replacer-content';

        // Add image sets to content div
        imageMap.forEach( (images, src) => {
            contentDiv.appendChild(createImageSetElement(src, images, imageMap));
        }
        );

        container.appendChild(contentDiv);
        document.body.appendChild(container);

        // Auto-collapse after 5 seconds
        setTimeout( () => {
            if (!isCollapsed) {
                container.classList.add('collapsed');
                toggleBtn.textContent = 'Expand';
                isCollapsed = true;
            }
        }
        , 5000);
    }

    // Main function
    function main() {
        const images = getVisibleImages();

        if (images.length === 0) {
            alert('No images found matching the criteria.');
            return;
        }

        const imageMap = groupImagesBySrc(images);
        createContainer(imageMap);
        attachHoverButtons(imageMap);

        //make all <p> element content editable
        document.querySelectorAll('p').forEach(p => {
            p.contentEditable = 'true';
        });

        console.log(`Found ${images.length} images in ${imageMap.size} unique sets`);
    }

    // Run the script
    main();
}
)();
