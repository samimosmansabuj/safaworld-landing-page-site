document.addEventListener('DOMContentLoaded', ()=>{

    const productsData = [
        {
            id:1,
            name:"Royal Wedding Panjabi",
            price:4500,
            category:"wedding",
            image:"image/panjabi1.jfif",
            images:["image/panjabi1.jfif","image/panjabi1_alt1.jfif","image/panjabi1_alt2.jfif"],
            description:"Luxurious silk panjabi with intricate embroidery.",
            sizes:["S","M","L","XL"]
        },
        {
            id:2,
            name:"Casual Cotton Panjabi",
            price:2500,
            category:"casual",
            image:"image/panjabi2.jpg",
            images:["image/panjabi2.jpg","image/panjabi2_alt1.jpg"],
            description:"Comfortable cotton panjabi, perfect for daily wear.",
            sizes:["S","M","L","XL"]
        },
        {
            id:3,
            name:"Festive Silk Panjabi",
            price:3800,
            category:"festive",
            image:"image/panjabi1.jfif",
            images:["image/panjabi1.jfif"],
            description:"Festive panjabi made from premium silk.",
            sizes:["S","M","L","XL"]
        },
    ];

    const productsContainer = document.getElementById('products');
    const cartIcon = document.getElementById('cart-icon');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCart = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModal = document.getElementById('close-modal');
    const placeOrderBtn = document.getElementById('place-order');
    const categories = document.querySelectorAll('.category');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // ================= RENDER PRODUCTS =================
    function renderProducts(filter="all"){
        productsContainer.innerHTML='';
        let filtered = filter==="all" ? productsData :
            productsData.filter(p=>p.category===filter);

        filtered.forEach(p=>{
            const div = document.createElement('div');
            div.classList.add('product-card');
            div.innerHTML=`
                <img src="${p.image}" alt="${p.name}">
                <h4>${p.name}</h4>
                <p>৳ ${p.price}</p>
                <button onclick="addToCart(${p.id})">Add to Cart</button>
                <button onclick="buyNow(${p.id})">Buy Now</button>
            `;
            productsContainer.appendChild(div);
        });

        attachProductClicks(); // attach click listeners for product detail
    }

    // ================= PRODUCT DETAIL MODAL =================
    let productDetailModal = document.getElementById('product-detail-modal');
    if(!productDetailModal){
        productDetailModal = document.createElement('div');
        productDetailModal.id = 'product-detail-modal';
        productDetailModal.className = 'checkout-modal';
        productDetailModal.innerHTML=`
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
    function attachProductClicks(){
        const cards = document.querySelectorAll('.product-card');
        cards.forEach(card=>{
            const img = card.querySelector('img');
            const name = card.querySelector('h4');
            [img,name].forEach(el=>{
                el.style.cursor='pointer';
                el.onclick=()=>{
                    const productName = card.querySelector('h4').textContent;
                    const product = productsData.find(p=>p.name===productName);
                    openProductDetail(product);
                }
            });
        });
    }

    // open modal
    function openProductDetail(product){
        mainDetailImg.src = product.image;

        // thumbnails
        detailThumbs.innerHTML='';
        const images = product.images || [product.image];
        images.forEach(src=>{
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.style.width='60px';
            thumb.style.height='60px';
            thumb.style.objectFit='cover';
            thumb.style.borderRadius='10px';
            thumb.style.cursor='pointer';
            thumb.addEventListener('click',()=> mainDetailImg.src=src);
            detailThumbs.appendChild(thumb);
        });

        // info
        detailName.textContent = product.name;
        detailPrice.textContent = product.price;
        detailDescription.textContent = product.description || 'No description available.';

        // sizes as boxes
        detailSize.innerHTML='';
        const sizes = product.sizes || ["S","M","L","XL"];
        sizes.forEach(s=>{
            const box = document.createElement('div');
            box.className='size-box';
            box.textContent = s;
            box.onclick = ()=>{
                detailSize.querySelectorAll('.size-box').forEach(b=>b.classList.remove('selected'));
                box.classList.add('selected');
            }
            detailSize.appendChild(box);
        });

        productDetailModal.style.display='flex';

        // Add to Cart
        detailAddToCart.onclick = ()=>{
            const selected = detailSize.querySelector('.size-box.selected');
            if(!selected){ alert("Please select a size!"); return; }
            const selectedSize = selected.textContent;
            const existing = cart.find(c=>c.id===product.id && c.size===selectedSize);
            if(existing){ existing.qty++ }
            else{ cart.push({...product, qty:1, size:selectedSize}); }
            updateCart();
            productDetailModal.style.display='none';
        };

        // Buy Now
        detailBuyNow.onclick = ()=>{
            const selected = detailSize.querySelector('.size-box.selected');
            if(!selected){ alert("Please select a size!"); return; }
            const selectedSize = selected.textContent;
            const existing = cart.find(c=>c.id===product.id && c.size===selectedSize);
            if(existing){ existing.qty++ }
            else{ cart.push({...product, qty:1, size:selectedSize}); }
            updateCart();
            productDetailModal.style.display='none';
            openCheckout();
        };
    }

    closeDetailModal.onclick = ()=> productDetailModal.style.display='none';

    // ================= UPDATE CART =================
    function updateCart(){
        cartItemsContainer.innerHTML='';
        let subtotal=0;
        cart.forEach(item=>{
            subtotal += item.price*item.qty;
            cartItemsContainer.innerHTML+=`
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="mini-img">
                    <div class="item-info">
                        <p class="item-name">${item.name}</p>
                        <p class="item-qty">Qty: ${item.qty}</p>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${item.id})">✖</button>
                </div>
            `;
        });
        const footer = document.querySelector('.cart-footer');
        footer.innerHTML = `
            <div class="subtotal-wrapper">
                <div class="subtotal-label">Subtotal</div>
                <div class="subtotal-amount">৳ <span id="subtotal">${subtotal}</span></div>
            </div>
            <button id="checkout-btn">Proceed to Checkout</button>
        `;
        document.getElementById('cart-count').textContent = cart.reduce((t,i)=>t+i.qty,0);
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    document.querySelector('.cart-footer').addEventListener('click', function(e){
        if(e.target && e.target.id==='checkout-btn'){
            openCheckout();
            cartDrawer.classList.remove('open');
        }
    });

    window.addToCart = function(id){
        const product = productsData.find(p=>p.id===id);
        const existing = cart.find(c=>c.id===id);
        if(existing){ existing.qty++ }
        else{ cart.push({...product,qty:1}); }
        updateCart();
        cartDrawer.classList.add('open');
    }

    window.buyNow = function(id){
        addToCart(id);
        openCheckout();
    }

    window.removeItem = function(id){
        cart = cart.filter(c=>c.id!==id);
        updateCart();
    }

    cartIcon.addEventListener('click',()=>cartDrawer.classList.add('open'));
    closeCart.addEventListener('click',()=>cartDrawer.classList.remove('open'));

    function openCheckout(){
        checkoutModal.style.display='flex';
        document.addEventListener('click', function(e){
            if(e.target && e.target.id === 'checkout-btn'){
                openCheckout();
                cartDrawer.classList.remove('open');
            }
        });
    }

    closeModal.addEventListener('click',()=>checkoutModal.style.display='none');

    placeOrderBtn.addEventListener('click', ()=>{
        checkoutModal.style.display='none';
        const successModal = document.getElementById('order-success-modal');
        const countdownEl = document.getElementById('countdown');
        successModal.style.display='flex';
        let count = 5;
        countdownEl.textContent=count;
        const timer = setInterval(()=>{
            count--;
            countdownEl.textContent=count;
            if(count<=0){
                clearInterval(timer);
                successModal.style.display='none';
                cart=[];
                updateCart();
                window.scrollTo(0,0);
            }
        },1000);
    });

    categories.forEach(cat=>{
        cat.addEventListener('click',()=> renderProducts(cat.dataset.filter));
    });

    renderProducts();
    updateCart();
});