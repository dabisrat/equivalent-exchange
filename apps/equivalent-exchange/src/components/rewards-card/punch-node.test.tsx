import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PunchNode from './punch-node';

describe('PunchNode Component', () => {
    it('renders correctly with all props', () => {
         render(
            <PunchNode cardId="123" punched={true} canModify={true} index={1} />
        );
        screen.debug();
    })
});