import React from 'react';
import faker from 'faker';
import {mount} from 'enzyme';
import {trigger} from '@shopify/enzyme-utilities';

import {Input} from '../../tests/components';
import {lastCallArgs} from '../../tests/utilities';
import FormState from '../..';

describe('<FormState.List />', () => {
  it('passes form state into child function for each index of the given array', () => {
    const renderPropSpy = jest.fn(() => null);

    const products = [
      {title: faker.commerce.productName()},
      {title: faker.commerce.productName()},
      {title: faker.commerce.productName()},
    ];

    mount(
      <FormState initialValues={{products}}>
        {({fields}) => {
          return (
            <FormState.List field={fields.products}>
              {renderPropSpy}
            </FormState.List>
          );
        }}
      </FormState>,
    );

    const calls = renderPropSpy.mock.calls;
    expect(calls).toHaveLength(products.length);

    calls.forEach(([fields], index) => {
      const expectedTitle = products[index].title;

      expect(fields.title.value).toBe(expectedTitle);
      expect(fields.title.initialValue).toBe(expectedTitle);
      expect(fields.title.dirty).toBe(false);
    });
  });

  it('updates the top level FormState‘s array when an inner field is updated', () => {
    const products = [{title: faker.commerce.productName()}];
    const newTitle = faker.commerce.productName();

    const renderPropSpy = jest.fn(({fields}: any) => {
      return (
        <FormState.List field={fields.products}>
          {(fields: any) => {
            return <Input {...fields.title} />;
          }}
        </FormState.List>
      );
    });

    const form = mount(
      <FormState initialValues={{products}}>{renderPropSpy}</FormState>,
    );

    const input = form.find(Input);
    trigger(input, 'onChange', newTitle);

    const {fields} = lastCallArgs(renderPropSpy);
    expect(fields.products.value[0].title).toBe(newTitle);
  });

  it('tracks individual sub-field dirty state', () => {
    const products = [{title: faker.commerce.productName()}];
    const newTitle = faker.commerce.productName();

    const renderSpy = jest.fn(() => null);

    const form = mount(
      <FormState initialValues={{products}}>
        {({fields}) => {
          return (
            <>
              <FormState.List field={fields.products}>
                {renderSpy}
              </FormState.List>
            </>
          );
        }}
      </FormState>,
    );

    const {title} = lastCallArgs(renderSpy);
    title.onChange(newTitle);

    const updatedFields = lastCallArgs(renderSpy);
    expect(updatedFields.title.dirty).toBe(true);
  });

  it('passes errors down to inner fields', () => {
    const products = [
      {
        title: faker.commerce.productName(),
        department: faker.commerce.department(),
      },
      {
        title: faker.commerce.productName(),
        department: faker.commerce.department(),
      },
    ];

    const field = {
      name: 'products',
      value: products,
      initialValue: products,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      dirty: false,
      changed: false,
      error: [
        {
          title: faker.lorem.words(5),
        },
        {
          department: faker.lorem.words(5),
        },
      ],
    };

    const renderSpy = jest.fn(() => null);
    mount(<FormState.List field={field}>{renderSpy}</FormState.List>);

    renderSpy.mock.calls.forEach(([fields], index) => {
      const {title, department} = fields;

      expect(title.error).toBe(field.error[index].title);
      expect(department.error).toBe(field.error[index].department);
    });
  });
});
