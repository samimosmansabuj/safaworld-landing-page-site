document.addEventListener('DOMContentLoaded', () => {
    // Product Fetch------------
    let productsData = [];
    async function fetchProducts() {
        try {
            const response = await fetch("https://api.zenxone.com/api/product-fetch/1002/");
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
    fetchProducts();

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

        productsData = result.data.map(p => {
            return {
                id: p.id,
                name: p.name,
                description: p.short_description || p.details || "",
                price: Number(p.discount_price) > 0
                    ? Number(p.discount_price)
                    : Number(p.price),
                image: p.primary_image
                    ? `${ENV.API_BASE_URL}${p.primary_image}`
                    : (p.images && p.images.length
                        ? `${ENV.API_BASE_URL}${p.images[0].image}`
                        : ""),
                variants: p.variants || []
            };
        });

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

    } catch (err) {
        console.error("Load error:", err);
    }
}

// ================= RENDER =================
function renderProducts() {
    const container = document.getElementById("products");
    container.innerHTML = "";

    productsData.forEach(product => {
        const div = document.createElement("div");
        div.className = "product-card";

        div.innerHTML = `
            <img src="${product.image}" alt="${product.name}" width="200">
            <h3>${product.name}</h3>
            <p>৳ ${product.price}</p>
            <button onclick="openProductDetail(${product.id})">View</button>
        `;

        container.appendChild(div);
    });
}

// ================= PRODUCT DETAIL =================
function openProductDetail(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    document.getElementById("product-detail-modal").style.display = "flex";

    document.getElementById("detail-name").textContent = product.name;
    document.getElementById("detail-price").textContent = product.price;
    document.getElementById("detail-description").textContent =
        product.description;

    document.getElementById("main-detail-img").src = product.image;

    // =============== CHECK OUT SUMMARY ==========
    function updateCheckoutSummary() {
        const checkoutProducts = document.getElementById('checkout-products');
        checkoutProducts.innerHTML = '';

            const sizeLabel = v.attributes?.size || "Option";

        cart.forEach(item => {
            console.log(item);
            subtotal += item.price * item.qty;
            checkoutProducts.innerHTML += `
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
                    <span>${item.name} (${item.size}) × ${item.qty}</span>
                    <span>৳ ${item.price * item.qty}</span>
                </div>
            `;
        });

                btn.classList.add("selected");

                btn.dataset.variantId = v.id;
                btn.dataset.price =
                    Number(v.discount_price) > 0
                        ? Number(v.discount_price)
                        : Number(v.price);
            };

            sizeContainer.appendChild(btn);
        });
    }

    document.getElementById("detail-buy-now").onclick = () =>
        submitOrder(product);
}

// ================= DELIVERY =================
function calculateDeliveryCharge(district) {
    district = district.toLowerCase().trim();
    if (district === "dhaka") return 60;
    if (district === "chattogram") return 120;
    return 150;
}

// ================= SUBMIT ORDER =================
async function submitOrder(product) {

    const selectedVariantBtn =
        document.querySelector("#detail-size .selected");

    let variantId = null;
    let unitPrice = product.price;

    if (selectedVariantBtn) {
        variantId = selectedVariantBtn.dataset.variantId;
        unitPrice = Number(selectedVariantBtn.dataset.price);
    }

    const quantity =
        Number(document.getElementById("modalQuantity")?.value) || 1;

    const name = document.getElementById("orderName").value.trim();
    const phone = document.getElementById("orderPhoneNumber").value.trim();
    const whatsapp =
        document.getElementById("orderWhatsappNumber")?.value.trim() || "";

    const address = document.getElementById("orderAddress").value.trim();
    const district = document.getElementById("deliverydistrict").value;

    if (!name || !phone || !address || !district) {
        alert("Please fill all required fields");
        return;
    }

    const subtotal = unitPrice * quantity;
    const delivery = calculateDeliveryCharge(district);
    const total = subtotal + delivery;

    const payload = {
        name,
        phone,
        whatsapp_number: whatsapp,
        address,
        district,
        product_id: product.id,
        variant_id: variantId,
        quantity,
        unit_price: unitPrice,
        subtotal,
        delivery,
        total,
        payment_type: "COD",
        payment_status: "Unpaid",
    };

    try {
        const res = await fetch(
            `${ENV.API_BASE_URL}/api/landing-page/order/create/`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        const result = await res.json();

        if (!res.ok) throw new Error(result.message);

        alert("Order placed successfully!");
        document.getElementById("product-detail-modal").style.display = "none";

    } catch (err) {
        console.error(err);
        alert("Order failed: " + err.message);
    }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});