document.addEventListener('DOMContentLoaded', () => {
    // Product Fetch------------
    let productsData = [];
    let categoryData = [];
    async function fetchProducts() {
        try {
            const response = await fetch("https://api.zenxone.com/api/products/");
            const result = await response.json();
            if (result.status) {
                productsData = result.data.map(product => ({
                    id: product.id,
                    name: product.name,
                    price: product.discount_price ? product.discount_price : product.price,
                    category: product.category,
                    image: product.images.length > 0 ? product.images[0].image : "image/no-image.jpg",
                    images: product.images.map(img => img.image),
                    description: product.short_description || "",
                    sizes: ["38", "40", "42", "44", "46"]
                }));
                renderProducts();
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }
    async function fetchCategories() {
        try {
            const response = await fetch("https://api.zenxone.com/api/categories/");
            const result = await response.json();
            if (result.status) {
                categoryData = result.data;
                renderCategories();
            };
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }
    fetchProducts();
    fetchCategories();

    // ================= RENDER PRODUCTS =================
    const productsContainer = document.getElementById('products');
    function renderProducts(filter = "all") {
        productsContainer.innerHTML = '';
        let filtered = filter === "all" ? productsData :
            productsData.filter(p => p.category === filter);

        filtered.forEach(p => {
            const div = document.createElement('div');
            div.classList.add('product-card');
            div.innerHTML = `
                <img src="${p.image}" alt="${p.name}">
                <h4>${p.name}</h4>
                <p>৳ ${p.price}</p>
                <button onclick="addToCart(${p.id})">Add to Cart</button>
                <button onclick="buyNow(${p.id})">Buy Now</button>
            `;
            productsContainer.appendChild(div);
        });
        attachProductClicks();
    }

    // ================= RENDER CATEGORIES =================
    const categoriesContainer = document.getElementById("categories");
    function renderCategories() {
        categoriesContainer.innerHTML = '';
        categoriesContainer.innerHTML += `<div class="category active" data-id="all">All</div>`;
        categoryData.forEach(c => {
            const div = document.createElement('div');
            div.classList.add('category')
            div.dataset.id = `${c.id}`
            div.innerHTML = `${c.name}`
            categoriesContainer.appendChild(div);
        });
    }

    const cartIcon = document.getElementById('cart-icon');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCart = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModal = document.getElementById('close-modal');
    const placeOrderBtn = document.getElementById('place-order');
    const categories = document.querySelectorAll('.category');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // ================= PRODUCT DETAIL MODAL =================
    let productDetailModal = document.getElementById('product-detail-modal');
    if (!productDetailModal) {
        productDetailModal = document.createElement('div');
        productDetailModal.id = 'product-detail-modal';
        productDetailModal.className = 'checkout-modal';
        productDetailModal.innerHTML = `
            <div class="modal-content">
                <span id="close-detail-modal" style="position:absolute;right:15px;top:10px;font-size:24px;cursor:pointer;">✖</span>
                <h3 id="detail-name"></h3>
                <div class="detail-images">
                    <img id="main-detail-img" style="width:100%;border-radius:15px;margin-bottom:10px;">
                    <div id="detail-thumbs" style="display:flex;gap:10px;overflow-x:auto;"></div>
                </div>
                <p><strong>Price:</strong> ৳ <span id="detail-price"></span></p>
                <p id="detail-description"></p>
                <div id="detail-size"></div>
                <div style="margin-top:15px;">
                    <button id="detail-add-to-cart">Add to Cart</button>
                    <button id="detail-buy-now">Buy Now</button>
                </div>
            </div>
        `;
        document.body.appendChild(productDetailModal);
    }

    const closeDetailModal = document.getElementById('close-detail-modal');
    const mainDetailImg = document.getElementById('main-detail-img');
    const detailThumbs = document.getElementById('detail-thumbs');
    const detailName = document.getElementById('detail-name');
    const detailDescription = document.getElementById('detail-description');
    const detailSize = document.getElementById('detail-size');
    const detailPrice = document.getElementById('detail-price');
    const detailAddToCart = document.getElementById('detail-add-to-cart');
    const detailBuyNow = document.getElementById('detail-buy-now');

    // attach clicks to open product modal
    function attachProductClicks() {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach(card => {
            const img = card.querySelector('img');
            const name = card.querySelector('h4');
            [img, name].forEach(el => {
                el.style.cursor = 'pointer';
                el.onclick = () => {
                    const productName = card.querySelector('h4').textContent;
                    const product = productsData.find(p => p.name === productName);
                    openProductDetail(product);
                }
            });
        });
    }

    // open modal
    function openProductDetail(product) {
        mainDetailImg.src = product.image;

        // thumbnails
        detailThumbs.innerHTML = '';
        const images = product.images || [product.image];
        images.forEach(src => {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.style.width = '60px';
            thumb.style.height = '60px';
            thumb.style.objectFit = 'cover';
            thumb.style.borderRadius = '10px';
            thumb.style.cursor = 'pointer';
            thumb.addEventListener('click', () => mainDetailImg.src = src);
            detailThumbs.appendChild(thumb);
        });

        // info
        detailName.textContent = product.name;
        detailPrice.textContent = product.price;
        detailDescription.textContent = product.description || 'No description available.';

        // sizes as boxes
        detailSize.innerHTML = '';
        const sizes = product.sizes || ["S", "M", "L", "XL"];
        sizes.forEach(s => {
            const box = document.createElement('div');
            box.className = 'size-box';
            box.textContent = s;
            box.onclick = () => {
                detailSize.querySelectorAll('.size-box').forEach(b => b.classList.remove('selected'));
                box.classList.add('selected');
            }
            detailSize.appendChild(box);
        });

        productDetailModal.style.display = 'flex';

        // Add to Cart
        detailAddToCart.onclick = () => {
            const selected = detailSize.querySelector('.size-box.selected');
            if (!selected) { alert("Please select a size!"); return; }
            const selectedSize = selected.textContent;
            const existing = cart.find(c => c.id === product.id && c.size === selectedSize);
            if (existing) { existing.qty++ }
            else { cart.push({ ...product, qty: 1, size: selectedSize }); }
            updateCart();
            productDetailModal.style.display = 'none';
        };

        // Buy Now
        detailBuyNow.onclick = () => {
            const selected = detailSize.querySelector('.size-box.selected');
            if (!selected) { alert("Please select a size!"); return; }
            const selectedSize = selected.textContent;
            const existing = cart.find(c => c.id === product.id && c.size === selectedSize);
            if (existing) { existing.qty++ }
            else { cart.push({ ...product, qty: 1, size: selectedSize }); }
            updateCart();
            productDetailModal.style.display = 'none';
            openCheckout();
        };
    }

    closeDetailModal.onclick = () => productDetailModal.style.display = 'none';

    // =============== CHECK OUT SUMMARY ==========
    function updateCheckoutSummary() {
        const checkoutProducts = document.getElementById('checkout-products');
        checkoutProducts.innerHTML = '';

        let subtotal = 0;

        cart.forEach(item => {
            subtotal += item.price * item.qty;
            checkoutProducts.innerHTML += `
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
                    <span>${item.name} (${item.size}) × ${item.qty}</span>
                    <span>৳ ${item.price * item.qty}</span>
                </div>
            `;
        });

        const district = document.getElementById('district').value;
        let delivery = 0;

        if (district === 'dhaka') delivery = 60;
        else if (district === 'chattogram') delivery = 120;
        else if (district) delivery = 150;

        document.getElementById('checkout-subtotal').innerText = subtotal;
        document.getElementById('checkout-delivery').innerText = delivery;
        document.getElementById('checkout-total').innerText = subtotal + delivery;
    }

    document.getElementById('district').addEventListener('change', updateCheckoutSummary);

    // ================= UPDATE CART =================
    function updateCart() {
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price * item.qty;
            cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="mini-img">

                <div class="item-info">
                    <p class="item-name">${item.name}</p>

                    <div class="item-bottom">
                        <div class="item-options">
                            ${item.sizes && item.sizes.length > 0
                    ? `<select onchange="changeSize(${item.id}, this.value)">
                                ${item.sizes.map(size =>
                        `<option value="${size}" ${size === item.size ? 'selected' : ''}>${size}</option>`
                    ).join('')}
                            </select>`
                    : ''}
                        </div>

                        <div class="qty-control">
                            <button onclick="changeQty(${item.id}, '${item.size || ''}', -1)">−</button>
                            <div class="qty-count">${item.qty}</div>
                            <button onclick="changeQty(${item.id}, '${item.size || ''}', 1)">+</button>
                        </div>

                        <button class="remove-btn"
                            onclick="removeItem(${item.id}, '${item.size || ''}')">✖</button>
                    </div>
                </div>
            </div>
            `;
        });

        // footer
        const footer = document.querySelector('.cart-footer');
        footer.innerHTML = `
            <div class="subtotal-wrapper">
                <div class="subtotal-label">Subtotal</div>
                <div class="subtotal-amount">৳ <span id="subtotal">${subtotal}</span></div>
            </div>
            <button id="checkout-btn">Proceed to Checkout</button>
        `;

        document.getElementById('cart-count').textContent = cart.reduce((t, i) => t + i.qty, 0);
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // =============== CHANGE SIZE ======================= 
    window.changeSize = function (id, newSize) {
        const item = cart.find(c => c.id === id);
        if (item) {
            item.size = newSize;
            updateCart();
            updateCheckoutSummary();
        }
    }

    // ================= CHANGE QUANTITY =================
    window.changeQty = function (id, size = '', delta) {
        const item = cart.find(c => c.id === id && (c.size || '') === size);
        if (!item) return;

        item.qty += delta;
        if (item.qty < 1) item.qty = 1;   // prevent 0
        updateCart();
    }

    // ================= REMOVE ITEM =================
    window.removeItem = function (id, size = '') {
        cart = cart.filter(c => !(c.id === id && (c.size || '') === size));
        updateCart();
    }
    document.querySelector('.cart-footer').addEventListener('click', function (e) {
        if (e.target && e.target.id === 'checkout-btn') {
            openCheckout();
            cartDrawer.classList.remove('open');
        }
    });

    // ================= SIZE POPUP (PRODUCT LIST) ==================
    let sizePopup = document.getElementById('size-popup');
    if (!sizePopup) {
        sizePopup = document.createElement('div');
        sizePopup.id = 'size-popup';
        sizePopup.className = 'checkout-modal'; // reuse existing modal CSS
        sizePopup.style.display = 'none';
        sizePopup.innerHTML = `
        <div class="modal-content" style="position:relative; max-width:300px; text-align:center;">
            <span id="size-close" style="position:absolute; top:10px; right:15px; font-size:24px; cursor:pointer;">✖</span>
            <h4>Select Size</h4>
            <div id="size-options" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:15px 0;"></div>
            <button id="size-confirm" style="margin-top:10px;">Confirm</button>
        </div>
    `;
        document.body.appendChild(sizePopup);
    }



    // Center popup using your existing modal CSS
    sizePopup.style.display = 'none';
    sizePopup.style.justifyContent = 'center';
    sizePopup.style.alignItems = 'center';
    sizePopup.style.position = 'fixed';
    sizePopup.style.top = '0';
    sizePopup.style.left = '0';
    sizePopup.style.width = '100%';
    sizePopup.style.height = '100%';
    sizePopup.style.background = 'rgba(0,0,0,0.6)'; // overlay dark

    // Close button functionality
    document.getElementById('size-close').onclick = () => {
        sizePopup.style.display = 'none';
    };

    let currentProductForSize = null;
    let selectedSizeForPopup = null;

    function openSizePopup(product, action) {
        currentProductForSize = { product, action };
        selectedSizeForPopup = null;

        const optionsContainer = document.getElementById('size-options');
        optionsContainer.innerHTML = '';
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexWrap = 'nowrap';   // prevent wrapping
        optionsContainer.style.justifyContent = 'center';
        optionsContainer.style.gap = '5px';
        (product.sizes || ["S", "M", "L", "XL"]).forEach(size => {
            const box = document.createElement('div');
            box.className = 'size-box';
            box.style.width = '40px';
            box.style.height = '40px';
            box.style.fontSize = '14px';
            box.style.borderRadius = '6px';
            box.style.textAlign = 'center';
            box.style.display = 'flex';             // use flex
            box.style.alignItems = 'center';        // vertical center
            box.style.justifyContent = 'center';    // horizontal center
            box.style.margin = '0 5px';
            box.style.cursor = 'pointer';
            box.textContent = size;
            box.style.cursor = 'pointer';
            box.onclick = () => {
                optionsContainer.querySelectorAll('.size-box').forEach(b => b.classList.remove('selected'));
                box.classList.add('selected');
                selectedSizeForPopup = size;
            }
            optionsContainer.appendChild(box);
        });

        sizePopup.style.display = 'flex';
    }

    // confirm button
    document.getElementById('size-confirm').onclick = () => {
        if (!selectedSizeForPopup) { alert("Please select a size!"); return; }
        const { product, action } = currentProductForSize;
        const existing = cart.find(c => c.id === product.id && c.size === selectedSizeForPopup);
        if (existing) { existing.qty++; }
        else { cart.push({ ...product, qty: 1, size: selectedSizeForPopup }); }

        updateCart();
        sizePopup.style.display = 'none';

        if (action === 'buyNow') openCheckout();
    }

    // ==================== ADD TO CART (PRODUCT LIST) ==================
    window.addToCart = function (id) {
        const product = productsData.find(p => p.id === id);
        openSizePopup(product, 'addToCart');
    }

    // ==================== BUY NOW (PRODUCT LIST) ==================
    window.buyNow = function (id) {
        const product = productsData.find(p => p.id === id);
        openSizePopup(product, 'buyNow');
    }

    cartIcon.addEventListener('click', () => cartDrawer.classList.add('open'));
    closeCart.addEventListener('click', () => cartDrawer.classList.remove('open'));

    function openCheckout() {
        checkoutModal.style.display = 'flex';
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'checkout-btn') {
                openCheckout();
                cartDrawer.classList.remove('open');
            }
        });
        updateCheckoutSummary();
    }

    closeModal.addEventListener('click', () => checkoutModal.style.display = 'none');

    placeOrderBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('address');
        const districtSelect = document.getElementById('district');
        if (!nameInput.value.trim()) { alert("Please enter your name"); return; }
        if (!phoneInput.value.trim()) { alert("Please enter your phone number"); return; }
        if (!addressInput.value.trim()) { alert("Please enter your address"); return; }
        if (!districtSelect.value) { alert("Please select your district"); return; }

        // calculate delivery charge
        let delivery = 0;
        switch (districtSelect.value) {
            case "dhaka": delivery = 60; break;
            case "chattogram": delivery = 120; break;
            default: delivery = 150;
        }

        let subtotal = cart.reduce((t, i) => t + i.price * i.qty, 0);
        const total = subtotal + delivery;
    });

    categories.forEach(cat => {
        cat.addEventListener('click', () => renderProducts(cat.dataset.filter));
    });

    renderCategories();
    renderProducts();
    updateCart();
});