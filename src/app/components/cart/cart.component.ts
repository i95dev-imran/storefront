import {Component, ChangeDetectorRef, OnInit, Injectable} from 'angular2/core';
import {MagentoService} from '../../services/magento.service';
import {Product} from '../../product';

@Component({
  selector   : 'cart',
  templateUrl: 'app/components/cart/cart.component.html',
})
@Injectable()
export class CartComponent implements OnInit {
  title = 'Cart';
  items;
  totals;

  constructor(private _magento: MagentoService,
              private _changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.refresh();
  }

  getCardId(): Promise<string> {
    var cartId = localStorage.getItem('cartId');

    if (cartId) {

      return Promise.resolve(cartId);

    } else {

      return new Promise<string>(resolve => {
        this._magento.getSwaggerClient().then(api => {
          api.quoteGuestCartManagementV1.quoteGuestCartManagementV1CreateEmptyCartPost().then(data => {
            console.log('Cart Id:', data);
            var cartId = data.data.replace(/"/g, '');
            localStorage.setItem('cartId', cartId);
            resolve(cartId);
          });
        });
      });
    }
  }

  add(product: Product) {
    return new Promise(resolve => {

      this.getCardId().then(cartId => {
        this._magento.getSwaggerClient().then(api => {
          api.quoteGuestCartItemRepositoryV1.quoteGuestCartItemRepositoryV1SavePost({
            cartId: cartId,
            $body : {
              'cartItem': {
                'quote_id': cartId,
                'sku'     : product.sku,
                'qty'     : 1,
              }
            }
          }).then(data => {
            console.log('Add to cart: ', data.obj);
            resolve();

            this.refresh();
          });
        });
      });

    });
  }

  // Refresh cart
  refresh() {
    this.getCardId().then(cartId => {
      this._magento.getSwaggerClient().then(api => {

        api.quoteGuestCartTotalRepositoryV1.quoteGuestCartTotalRepositoryV1GetGet({
          cartId: cartId,
        }).then(data => {
          console.log('Cart:', data.obj);

          this.items = data.obj.items;
          this.totals = data.obj.total_segments;

          this._changeDetectorRef.detectChanges();
        });

      });
    });
  }
}