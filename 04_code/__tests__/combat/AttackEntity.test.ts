/**
 * 攻击实体系统测试
 */

import {
    AttackEntity,
    AttackEntityData,
    AttackEntityType,
    AttackEntityState,
    generateAttackEntityId,
} from '../../combat/AttackEntity';
import { Projectile, ProjectileConfig } from '../../combat/Projectile';
import { MeleeHitbox, MeleeHitboxShape, MeleeHitboxConfig } from '../../combat/MeleeHitbox';
import { DamageType } from '../../core/GameConfig';

// 测试用的具体攻击实体实现
class TestAttackEntity extends AttackEntity {
    constructor(data: AttackEntityData) {
        super(data);
    }

    get type(): AttackEntityType {
        return AttackEntityType.PROJECTILE;
    }

    protected onUpdate(_deltaTime: number): void {
        // 测试用，不做任何事
    }
}

describe('AttackEntity', () => {
    let entity: TestAttackEntity;
    let entityData: AttackEntityData;

    beforeEach(() => {
        entityData = {
            ownerId: 'player_1',
            position: { x: 0, y: 0 },
            direction: { x: 1, y: 0 },
            baseDamage: 10,
            damageType: DamageType.NORMAL,
            lifetime: 1.0,
            piercing: false,
            canCrit: true,
            critRate: 0.1,
            hitboxRadius: 10,
        };
        entity = new TestAttackEntity(entityData);
    });

    describe('基础属性', () => {
        it('应该正确初始化', () => {
            expect(entity.id).toBeDefined();
            expect(entity.ownerId).toBe('player_1');
            expect(entity.position).toEqual({ x: 0, y: 0 });
            expect(entity.direction).toEqual({ x: 1, y: 0 });
            expect(entity.state).toBe(AttackEntityState.ACTIVE);
            expect(entity.isFinished).toBe(false);
        });

        it('应该正确获取攻击数据', () => {
            const data = entity.getAttackData();
            expect(data.baseDamage).toBe(10);
            expect(data.damageType).toBe(DamageType.NORMAL);
            expect(data.hitboxRadius).toBe(10);
        });
    });

    describe('生命周期', () => {
        it('应该在存活时间结束后过期', () => {
            expect(entity.update(0.5)).toBe(true);
            expect(entity.isFinished).toBe(false);

            expect(entity.update(0.5)).toBe(false);
            expect(entity.isFinished).toBe(true);
            expect(entity.state).toBe(AttackEntityState.EXPIRED);
        });

        it('应该可以被手动销毁', () => {
            entity.destroy();
            expect(entity.isFinished).toBe(true);
            expect(entity.state).toBe(AttackEntityState.EXPIRED);
        });
    });

    describe('碰撞检测', () => {
        it('应该正确检测碰撞', () => {
            // 目标在碰撞范围内
            expect(entity.checkCollision({ x: 5, y: 0 }, 5)).toBe(true);

            // 目标在碰撞范围外
            expect(entity.checkCollision({ x: 25, y: 0 }, 5)).toBe(false);
        });

        it('应该正确设置位置', () => {
            entity.setPosition(100, 200);
            expect(entity.position).toEqual({ x: 100, y: 200 });
        });
    });

    describe('命中逻辑', () => {
        it('应该正确判断是否可以命中目标', () => {
            // 不能命中自己
            expect(entity.canHitTarget('player_1')).toBe(false);

            // 可以命中其他目标
            expect(entity.canHitTarget('enemy_1')).toBe(true);
        });

        it('应该记录命中的目标', () => {
            entity.recordHit('enemy_1');
            expect(entity.canHitTarget('enemy_1')).toBe(false);
            expect(entity.isFinished).toBe(true); // 非穿透攻击命中后结束
        });

        it('穿透攻击应该可以命中多个目标', () => {
            const piercingData: AttackEntityData = {
                ...entityData,
                piercing: true,
                maxPierceCount: 3,
            };
            const piercingEntity = new TestAttackEntity(piercingData);

            piercingEntity.recordHit('enemy_1');
            expect(piercingEntity.canHitTarget('enemy_1')).toBe(false);
            expect(piercingEntity.isFinished).toBe(false);

            piercingEntity.recordHit('enemy_2');
            expect(piercingEntity.isFinished).toBe(false);

            piercingEntity.recordHit('enemy_3');
            expect(piercingEntity.isFinished).toBe(true); // 达到最大穿透次数
        });
    });
});

describe('Projectile', () => {
    let projectile: Projectile;
    let config: ProjectileConfig;

    beforeEach(() => {
        config = {
            ownerId: 'player_1',
            position: { x: 0, y: 0 },
            direction: { x: 1, y: 0 },
            speed: 100,
            baseDamage: 15,
            lifetime: 2,
            hitboxRadius: 5,
        };
        projectile = Projectile.create(config);
    });

    describe('创建', () => {
        it('应该正确创建投射物', () => {
            expect(projectile).toBeDefined();
            expect(projectile.speed).toBe(100);
            expect(projectile.velocity).toEqual({ x: 100, y: 0 });
            expect(projectile.type).toBe(AttackEntityType.PROJECTILE);
        });

        it('应该标准化方向向量', () => {
            const diagonalProjectile = Projectile.create({
                ...config,
                direction: { x: 3, y: 4 }, // 应该被标准化为 (0.6, 0.8)
            });
            expect(diagonalProjectile.direction.x).toBeCloseTo(0.6, 5);
            expect(diagonalProjectile.direction.y).toBeCloseTo(0.8, 5);
        });
    });

    describe('移动', () => {
        it('应该正确移动', () => {
            projectile.update(0.1);
            expect(projectile.position.x).toBeCloseTo(10, 5);
            expect(projectile.position.y).toBeCloseTo(0, 5);
        });

        it('应该在存活时间结束后过期', () => {
            projectile.update(2.0);
            expect(projectile.isFinished).toBe(true);
        });
    });
});

describe('MeleeHitbox', () => {
    describe('扇形判定框', () => {
        let hitbox: MeleeHitbox;
        let config: MeleeHitboxConfig;

        beforeEach(() => {
            config = {
                ownerId: 'player_1',
                ownerPosition: { x: 0, y: 0 },
                facingAngle: 0, // 朝向右侧
                shape: MeleeHitboxShape.SECTOR,
                range: 50,
                baseDamage: 20,
                duration: 0.1,
                sectorAngle: Math.PI / 3, // 60度
            };
            hitbox = MeleeHitbox.createSector(config);
        });

        it('应该正确创建扇形判定框', () => {
            expect(hitbox).toBeDefined();
            expect(hitbox.shape).toBe(MeleeHitboxShape.SECTOR);
            expect(hitbox.type).toBe(AttackEntityType.MELEE_HITBOX);
        });

        it('应该检测到前方的目标', () => {
            // 前方的目标应该被检测到
            expect(hitbox.checkCollision({ x: 30, y: 0 }, 10)).toBe(true);

            // 后方的目标不应该被检测到
            expect(hitbox.checkCollision({ x: -30, y: 0 }, 10)).toBe(false);
        });

        it('应该在持续时间后过期', () => {
            expect(hitbox.isFinished).toBe(false);
            hitbox.update(0.1);
            expect(hitbox.isFinished).toBe(true);
        });
    });

    describe('圆形判定框', () => {
        let hitbox: MeleeHitbox;

        beforeEach(() => {
            hitbox = MeleeHitbox.createCircle({
                ownerId: 'player_1',
                ownerPosition: { x: 0, y: 0 },
                facingAngle: 0,
                range: 40,
                baseDamage: 15,
                duration: 0.15,
            });
        });

        it('应该正确创建圆形判定框', () => {
            expect(hitbox).toBeDefined();
            expect(hitbox.shape).toBe(MeleeHitboxShape.CIRCLE);
        });

        it('应该检测到范围内的目标', () => {
            // 范围内的目标
            expect(hitbox.checkCollision({ x: 15, y: 15 }, 10)).toBe(true);

            // 范围外的目标
            expect(hitbox.checkCollision({ x: 100, y: 100 }, 10)).toBe(false);
        });
    });

    describe('矩形判定框', () => {
        let hitbox: MeleeHitbox;

        beforeEach(() => {
            hitbox = MeleeHitbox.createRectangle({
                ownerId: 'player_1',
                ownerPosition: { x: 0, y: 0 },
                facingAngle: 0,
                range: 60,
                baseDamage: 25,
                duration: 0.1,
                width: 30,
            });
        });

        it('应该正确创建矩形判定框', () => {
            expect(hitbox).toBeDefined();
            expect(hitbox.shape).toBe(MeleeHitboxShape.RECTANGLE);
        });

        it('应该检测到矩形范围内的目标', () => {
            // 矩形内的目标
            expect(hitbox.checkCollision({ x: 20, y: 5 }, 5)).toBe(true);

            // 矩形外的目标
            expect(hitbox.checkCollision({ x: 100, y: 100 }, 5)).toBe(false);
        });
    });
});

describe('generateAttackEntityId', () => {
    it('应该生成唯一的ID', () => {
        const id1 = generateAttackEntityId();
        const id2 = generateAttackEntityId();
        expect(id1).not.toBe(id2);
        expect(id1).toMatch(/^attack_\d+_\d+$/);
    });
});
