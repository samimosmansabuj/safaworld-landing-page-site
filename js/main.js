// if (window.ENV && window.ENV.FACEBOOK_DOMAIN_VERIFICATION) {
//     const fbMetaTag = document.querySelector(
//         'meta[name="facebook-domain-verification"]'
//     );
//     console.log("fbMetaTag: ", fbMetaTag);
//     if (fbMetaTag) {
//         fbMetaTag.setAttribute(
//             'content',
//             window.ENV.FACEBOOK_DOMAIN_VERIFICATION
//         );
//     } else {
//         const meta = document.createElement('meta');
//         meta.setAttribute('name', 'facebook-domain-verification');
//         meta.setAttribute(
//             'content',
//             window.ENV.FACEBOOK_DOMAIN_VERIFICATION
//         );
//         document.head.appendChild(meta);
//     }
// }

document.addEventListener('DOMContentLoaded', () => {
    // ================= DATA =================
    let productsData = [];
    let selectedCategory = null;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const productsContainer = document.getElementById('products');
    const categoryContainer = document.getElementById('category-container');
    const cartIcon = document.getElementById('cart-icon');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCart = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModal = document.getElementById('close-modal');
    const placeOrderBtn = document.getElementById('place-order');

    // ================= FETCH CATEGORIES =================
    async function fetchCategories() {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/api/categories/`);
            const result = await res.json();
            if (result.status && categoryContainer) {
                categoryContainer.innerHTML = '';

                // "All" category
                const allBtn = document.createElement('div');
                allBtn.className = 'category';
                allBtn.textContent = 'All';
                allBtn.dataset.filter = 'all';
                allBtn.onclick = () => {
                    selectedCategory = null;
                    fetchProducts();
                };
                categoryContainer.appendChild(allBtn);

                result.data.forEach(cat => {
                    const btn = document.createElement('div');
                    btn.className = 'category';
                    btn.textContent = cat.name;
                    btn.dataset.filter = cat.id;
                    btn.onclick = () => {
                        selectedCategory = cat.id;
                        fetchProducts();
                    };
                    categoryContainer.appendChild(btn);
                });
            }
        } catch (err) {
            console.error("Category fetch error:", err);
        }
    }

    // ================= FETCH PRODUCTS =================
    async function fetchProducts() {
        try {
            let url = `${ENV.API_BASE_URL}/api/products/?page_size=${ENV.PRODUCT_PER_PAGE}&ordering=${ENV.PRODUCT_ORDERING}`;
            if (selectedCategory) url += `&category=${selectedCategory}`;

            const res = await fetch(url);
            const result = await res.json();

            if (result.status) {
                productsData = result.data.map(product => ({
                    id: product.id,
                    name: product.name,
                    main_price: product.price || product.price,
                    price: product.discount_price || product.price,
                    category: product.category?.id || null,
                    image: product.images?.length > 0 ? product.images[0].image : "image/no-image.jpg",
                    images: product.images?.map(img => img.image) || [],
                    description: product.short_description || "",
                    variants: product.variants || [],
                    sizes: product.variants?.map(v => v.attributes?.size).filter(Boolean) || []
                    // sizes: ["38", "40", "42", "44", "46"] // default sizes, can modify per product
                }));
                renderProducts();
            }
        } catch (err) {
            console.error("Product fetch error:", err);
        }
    }

    // ================= RENDER PRODUCTS =================
    function renderProducts() {
        productsContainer.innerHTML = '';
        productsData.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <img src="${p.image}" alt="${p.name}">
                <h4>${p.name}</h4>
                <p>৳ <del><span id="main-price" style="color: #ff0000; font-size: 15px;">${p.main_price}</span></del> ${p.price}</p>
                <button onclick="addToCart(${p.id})">Add to Cart</button>
                <button onclick="buyNow(${p.id})">Buy Now</button>
            `;
            productsContainer.appendChild(div);
        });
        attachProductClicks();
    }

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
                <p><strong>Price:</strong> ৳ <del><span id="main-price" style="color: #ff0000; font-size: 19px;"></span></del> <span id="detail-price"></span></p>
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
    const mainPrice = document.getElementById('main-price');
    const detailPrice = document.getElementById('detail-price');
    const detailAddToCart = document.getElementById('detail-add-to-cart');
    const detailBuyNow = document.getElementById('detail-buy-now');

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
                };
            });
        });
    }

    function openProductDetail(product) {
        // View Content Event Tracking
        FacebookViewContentEvent(product.name, product.price, product.id);

        mainDetailImg.src = product.image;
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

        detailName.textContent = product.name;
        mainPrice.textContent = product.main_price;
        detailPrice.textContent = product.price;
        detailDescription.textContent = product.description || 'No description available.';
        detailSize.innerHTML = '';
        (product.sizes || ["S", "M", "L", "XL"]).forEach(s => {
            const box = document.createElement('div');
            box.className = 'size-box';
            box.textContent = s;
            box.onclick = () => {
                detailSize.querySelectorAll('.size-box').forEach(b => b.classList.remove('selected'));
                box.classList.add('selected');
            };
            detailSize.appendChild(box);
        });

        productDetailModal.style.display = 'flex';

        // Detail add to cart
        detailAddToCart.onclick = () => handleCartAction(product, 'add');
        detailBuyNow.onclick = () => handleCartAction(product, 'buy');
    }

    closeDetailModal.onclick = () => productDetailModal.style.display = 'none';

    function handleCartAction(product, action) {
        const selected = detailSize.querySelector('.size-box.selected');
        if (!selected) { alert("Please select a size!"); return; }
        const size = selected.textContent;
        const existing = cart.find(c => c.id === product.id && c.size === size);
        if (existing) { existing.qty++; }
        else { cart.push({ ...product, qty: 1, size }); }
        updateCart();
        productDetailModal.style.display = 'none';
        if (action === 'buy') openCheckout();
    }

    // ================= SIZE POPUP =================
    let sizePopup = document.getElementById('size-popup');
    if (!sizePopup) {
        sizePopup = document.createElement('div');
        sizePopup.id = 'size-popup';
        sizePopup.className = 'checkout-modal';
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
    document.getElementById('size-close').onclick = () => sizePopup.style.display = 'none';

    let currentProductForSize = null;
    let selectedSizeForPopup = null;
    function openSizePopup(product, action) {
        currentProductForSize = { product, action };
        selectedSizeForPopup = null;
        const optionsContainer = document.getElementById('size-options');
        optionsContainer.innerHTML = '';
        (product.sizes || ["S", "M", "L", "XL"]).forEach(size => {
            const box = document.createElement('div');
            box.className = 'size-box';
            box.textContent = size;
            box.onclick = () => {
                optionsContainer.querySelectorAll('.size-box').forEach(b => b.classList.remove('selected'));
                box.classList.add('selected');
                selectedSizeForPopup = size;
            };
            optionsContainer.appendChild(box);
        });
        sizePopup.style.display = 'flex';
    }

    document.getElementById('size-confirm').onclick = () => {
        if (!selectedSizeForPopup) { alert("Please select a size!"); return; }
        const { product, action } = currentProductForSize;
        const existing = cart.find(c => c.id === product.id && c.size === selectedSizeForPopup);
        if (existing) existing.qty++; else cart.push({ ...product, qty: 1, size: selectedSizeForPopup });
        updateCart();
        sizePopup.style.display = 'none';
        if (action === 'buyNow') openCheckout();
    };

    window.addToCart = (id) => {
        const product = productsData.find(p => p.id === id);
        openSizePopup(product, 'addToCart');
    };
    window.buyNow = (id) => {
        const product = productsData.find(p => p.id === id);
        openSizePopup(product, 'buyNow');
    };

    // ================= CART =================
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
                            ${item.sizes?.length > 0
                    ? `<select onchange="changeSize(${item.id}, this.value)">
                                ${item.sizes.map(size => `<option value="${size}" ${size === item.size ? 'selected' : ''}>${size}</option>`).join('')}
                            </select>` : ''}
                        </div>
                        <div class="qty-control">
                            <button onclick="changeQty(${item.id}, '${item.size || ''}', -1)">−</button>
                            <div class="qty-count">${item.qty}</div>
                            <button onclick="changeQty(${item.id}, '${item.size || ''}', 1)">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeItem(${item.id}, '${item.size || ''}')">✖</button>
                    </div>
                </div>
            </div>`;
        });
        const footer = document.querySelector('.cart-footer');
        const cartTotal = cart.reduce((t, i) => t + i.price * i.qty, 0);
        footer.innerHTML = `<div class="subtotal-wrapper">
            <div class="subtotal-label">Subtotal</div>
            <div class="subtotal-amount">৳ <span id="subtotal">${cartTotal}</span></div>
        </div>
        <button id="checkout-btn">Proceed to Checkout</button>`;

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.onclick = () => {
                openCheckout();
                cartDrawer.classList.remove('open');
            };
        }

        document.getElementById('cart-count').textContent = cart.reduce((t, i) => t + i.qty, 0);
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    window.changeSize = (id, newSize) => { const item = cart.find(c => c.id === id); if (item) { item.size = newSize; updateCart(); updateCheckoutSummary(); } };
    window.changeQty = (id, size, delta) => { const item = cart.find(c => c.id === id && (c.size || '') === size); if (!item) return; item.qty += delta; if (item.qty < 1) item.qty = 1; updateCart(); };
    window.removeItem = (id, size) => { cart = cart.filter(c => !(c.id === id && (c.size || '') === size)); updateCart(); };

    cartIcon.onclick = () => cartDrawer.classList.add('open');
    closeCart.onclick = () => cartDrawer.classList.remove('open');

    function openCheckout() { checkoutModal.style.display = 'flex'; updateCheckoutSummary(); }
    const districtSelect = document.getElementById('district');
    if (districtSelect) {
        districtSelect.addEventListener('change', updateCheckoutSummary);
    }
    closeModal.onclick = () => checkoutModal.style.display = 'none';

    function updateCheckoutSummary() {
        const checkoutProducts = document.getElementById('checkout-products');
        checkoutProducts.innerHTML = '';
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price * item.qty;
            checkoutProducts.innerHTML += `<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;"><span>${item.name} (${item.size}) × ${item.qty}</span><span>৳ ${item.price * item.qty}</span></div>`;
        });
        const district = document.getElementById('district').value;
        let delivery = 0;
        if (district) {
            delivery = district === 'dhaka' ? 60 : 130;
        }
        document.getElementById('checkout-subtotal').innerText = subtotal;
        document.getElementById('checkout-delivery').innerText = delivery;
        document.getElementById('checkout-total').innerText = subtotal + delivery;
    }

    // ================= FETCH DISTRICT LIST =================
    async function fetchDistricts() {
        const districtSelect = document.getElementById('district');
        if (!districtSelect) return;

        try {
            const res = await fetch('https://bdapi.vercel.app/api/v.1/district');
            const data = await res.json();

            if (data.status === 200 && data.success) {
                districtSelect.innerHTML = '<option value="">Select District</option>';

                data.data.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.name.toLowerCase();  // important for dhaka check
                    option.textContent = district.bn_name;
                    districtSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.log('Error fetching district:', error);
        }
    }

    // ================= PLACE ORDER =================
    placeOrderBtn.onclick = async () => {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const district = document.getElementById('district').value;
        if (!name || !phone || !address || !district) { alert("All fields are required!"); return; }
        if (cart.length === 0) { alert("Cart is empty!"); return; }

        const items = cart.map(i => {
            const product = productsData.find(p => p.id === i.id);
            // Find variant by size
            const variant = product.variants?.find(v => v.attributes?.size === i.size);
            return {
                product_id: i.id,
                quantity: i.qty,
                variant_id: variant?.id  // Send variant_id to backend
            };
        });        const payload = { name, phone, address, district, items };

        try {
            const res = await fetch(`${ENV.API_BASE_URL}/api/order/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.status) {

                // Close checkout
                checkoutModal.style.display = 'none';
            
                // Clear cart
                cart = [];
                updateCart();
            
                // Show success modal
                const successModal = document.getElementById('order-success-modal');
                const countdownEl = document.getElementById('countdown');
                successModal.style.display = 'flex';
            
                let timeLeft = 5;
                countdownEl.textContent = timeLeft;
            
                const timer = setInterval(() => {
                    timeLeft--;
                    countdownEl.textContent = timeLeft;
            
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        successModal.style.display = 'none';
                        window.location.reload(); // or window.location.href = "/";
                    }
                }, 1000);
            }
            else alert("Order failed: " + result.message);
        } catch (err) { console.error("Order error:", err); alert("Order error!"); }
    }

    // ================= INITIAL LOAD =================
    updateCart();
    fetchCategories();
    fetchProducts();
    fetchDistricts();
});